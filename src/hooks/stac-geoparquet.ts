import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { io } from "@geoarrow/geoarrow-js";
import { useQuery } from "@tanstack/react-query";
import {
  Binary,
  Data,
  makeData,
  makeVector,
  Table,
  vectorFromArray,
} from "apache-arrow";
import { useDuckDb } from "duckdb-wasm-kit";
import { useEffect, useState } from "react";
import * as stacWasm from "../stac-wasm";
import type { StacGeoparquetMetadata } from "../types/stac";
import type { DateRange } from "../components/date-filter";

function createDateTime(date: Date, time?: string): Date {
  if (!time) return date;

  const [hours, minutes] = time.split(":").map(Number);
  const datetime = new Date(date);
  datetime.setHours(hours, minutes, 0, 0);
  return datetime;
}

function getEffectiveStartDateTime(dateRange: DateRange): Date | null {
  if (!dateRange.startDate) return null;
  return createDateTime(dateRange.startDate, dateRange.startTime);
}

function getEffectiveEndDateTime(dateRange: DateRange): Date | null {
  if (!dateRange.endDate) return null;
  return createDateTime(dateRange.endDate, dateRange.endTime);
}

export default function useStacGeoparquet({
  path,
  id,
  dateRange,
}: {
  path: string | undefined;
  id: string | undefined;
  dateRange: DateRange;
}) {
  const { db } = useDuckDb();
  const [connection, setConnection] = useState<AsyncDuckDBConnection>();

  const { data: table } = useQuery({
    queryKey: ["stac-geoparquet-table", path, dateRange],
    queryFn: async () => {
      if (path && connection) {
        return await getTable(path, connection, dateRange);
      }
    },
    enabled: !!(connection && path),
  });
  const { data: metadata } = useQuery({
    queryKey: ["stac-geoparquet-metadata", path, dateRange],
    queryFn: async () => {
      if (path && connection) {
        return await getMetadata(path, connection, dateRange);
      }
    },
    enabled: !!(connection && path),
  });
  const { data: item } = useQuery({
    queryKey: ["stac-geoparquet-item", path, id, dateRange],
    queryFn: async () => {
      if (path && connection && id) {
        return await getItem(path, connection, id, dateRange);
      }
    },
    enabled: !!(connection && path && id),
  });

  useEffect(() => {
    (async () => {
      if (db) {
        const connection = await db.connect();
        connection.query("LOAD spatial;");
        setConnection(connection);
      }
    })();
  }, [db]);

  return { table, metadata, item };
}

async function getTable(
  path: string,
  connection: AsyncDuckDBConnection,
  dateRange: DateRange,
) {
  let query = `SELECT ST_AsWKB(geometry) as geometry, id FROM read_parquet('${path}')`;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  if (effectiveStartDate || effectiveEndDate) {
    const conditions = [];
    if (effectiveStartDate) {
      conditions.push(`datetime >= '${effectiveStartDate.toISOString()}'`);
    }
    if (effectiveEndDate) {
      conditions.push(`datetime <= '${effectiveEndDate.toISOString()}'`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
  }

  const result = await connection.query(query);
  const geometry: Uint8Array[] = result.getChildAt(0)?.toArray();
  const wkb = new Uint8Array(geometry?.flatMap((array) => [...array]));
  const valueOffsets = new Int32Array(geometry.length + 1);
  for (let i = 0, len = geometry.length; i < len; i++) {
    const current = valueOffsets[i];
    valueOffsets[i + 1] = current + geometry[i].length;
  }
  const data: Data<Binary> = makeData({
    type: new Binary(),
    data: wkb,
    valueOffsets,
  });
  const polygons = io.parseWkb(data, io.WKBType.Polygon, 2);
  const table = new Table({
    // @ts-expect-error: 2769
    geometry: makeVector(polygons),
    id: vectorFromArray(result.getChild("id")?.toArray()),
  });
  table.schema.fields[0].metadata.set(
    "ARROW:extension:name",
    "geoarrow.polygon",
  );
  return table;
}

async function getMetadata(
  path: string,
  connection: AsyncDuckDBConnection,
  dateRange: DateRange,
): Promise<StacGeoparquetMetadata> {
  let query = `SELECT COUNT(*) as count, MIN(bbox.xmin) as xmin, MIN(bbox.ymin) as ymin, MAX(bbox.xmax) as xmax, MAX(bbox.ymax) as ymax FROM read_parquet('${path}')`;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  if (effectiveStartDate || effectiveEndDate) {
    const conditions = [];
    if (effectiveStartDate) {
      conditions.push(`datetime >= '${effectiveStartDate.toISOString()}'`);
    }
    if (effectiveEndDate) {
      conditions.push(`datetime <= '${effectiveEndDate.toISOString()}'`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
  }

  const summaryResult = await connection.query(query);
  const summaryRow = summaryResult.toArray().map((row) => row.toJSON())[0];

  const kvMetadataResult = await connection.query(
    `SELECT key, value FROM parquet_kv_metadata('${path}')`,
  );
  const decoder = new TextDecoder("utf-8");
  const kvMetadata = kvMetadataResult.toArray().map((row) => {
    const jsonRow = row.toJSON();
    const key = decoder.decode(jsonRow.key);
    let value;
    try {
      value = JSON.parse(decoder.decode(jsonRow.value));
    } catch {
      // pass
    }
    return {
      key,
      value,
    };
  });

  return {
    count: summaryRow.count,
    bbox: [summaryRow.xmin, summaryRow.ymin, summaryRow.xmax, summaryRow.ymax],
    keyValue: kvMetadata,
  };
}

async function getItem(
  path: string,
  connection: AsyncDuckDBConnection,
  id: string,
  dateRange: DateRange,
) {
  let query = `SELECT * REPLACE ST_AsGeoJSON(geometry) as geometry FROM read_parquet('${path}') WHERE id = '${id}'`;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  if (effectiveStartDate || effectiveEndDate) {
    const conditions = [];
    if (effectiveStartDate) {
      conditions.push(`datetime >= '${effectiveStartDate.toISOString()}'`);
    }
    if (effectiveEndDate) {
      conditions.push(`datetime <= '${effectiveEndDate.toISOString()}'`);
    }
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(" AND ")}`;
    }
  }

  const result = await connection.query(query);
  const item = stacWasm.arrowToStacJson(result)[0];
  item.geometry = JSON.parse(item.geometry);
  return item;
}
