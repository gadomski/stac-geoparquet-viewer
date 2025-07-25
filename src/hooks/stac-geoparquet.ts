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

export default function useStacGeoparquet(path: string | undefined) {
  const [id, setId] = useState<string>();
  const { db } = useDuckDb();
  const [connection, setConnection] = useState<AsyncDuckDBConnection>();
  const { data: table } = useQuery({
    queryKey: ["stac-geoparquet-table", path],
    queryFn: async () => {
      if (path && connection) {
        return await getTable(path, connection);
      }
    },
    enabled: !!(connection && path),
  });
  const { data: metadata } = useQuery({
    queryKey: ["stac-geoparquet-metadata", path],
    queryFn: async () => {
      if (path && connection) {
        return await getMetadata(path, connection);
      }
    },
    enabled: !!(connection && path),
  });
  const { data: item } = useQuery({
    queryKey: ["stac-geoparquet-item", path, id],
    queryFn: async () => {
      if (path && connection && id) {
        return await getItem(path, connection, id);
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

  return { table, metadata, item, setId };
}

async function getTable(path: string, connection: AsyncDuckDBConnection) {
  const result = await connection.query(
    `SELECT ST_AsWKB(geometry) as geometry, id FROM read_parquet('${path}')`,
  );
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
): Promise<StacGeoparquetMetadata> {
  const summaryResult = await connection.query(
    `SELECT COUNT(*) as count, MIN(bbox.xmin) as xmin, MIN(bbox.ymin) as ymin, MAX(bbox.xmax) as xmax, MAX(bbox.ymax) as ymax FROM read_parquet('${path}')`,
  );
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
) {
  const result = await connection.query(
    `SELECT * REPLACE ST_AsGeoJSON(geometry) as geometry FROM read_parquet('${path}') WHERE id = '${id}'`,
  );
  const item = stacWasm.arrowToStacJson(result)[0];
  item.geometry = JSON.parse(item.geometry);
  return item;
}
