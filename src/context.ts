import type { UseFileUploadReturn } from "@chakra-ui/react";
import type { Table } from "apache-arrow";
import { createContext } from "react";
import type { StacCollection, StacItem } from "stac-ts";
import type { StacGeoparquetMetadata, StacValue } from "./types/stac";

export const StacMapContext = createContext<StacMapContextType | null>(null);

interface StacMapContextType {
  /// The root href for the app, used to load `value`.
  ///
  /// This is sync'd with a url parameter.
  href: string | undefined;

  /// A function to set the href.
  setHref: (href: string | undefined) => void;

  /// A shared fileUpload structure that is the source of JSON or
  /// stac-geoparquet bytes.
  fileUpload: UseFileUploadReturn;

  /// The root STAC value.
  value: StacValue | undefined;

  /// Any collections that belong to the `value`.
  ///
  /// This is usually populated only if the value is a Catalog.
  collections: StacCollection[] | undefined;

  /// The GeoJSON items, usually returned from a search.
  items: StacItem[] | undefined;

  /// A function to set the items.
  setItems: (items: StacItem[] | undefined) => void;

  /// A picked item.
  ///
  /// "picking" usually involves clicking on the map.
  picked: StacItem | undefined;

  /// Set the picked item.
  setPicked: (value: StacItem | undefined) => void;

  /// The stac-geoparquet table that's currently loaded.
  stacGeoparquetTable: Table | undefined;

  /// The stac-geoparquet metadata that are currently loaded.
  stacGeoparquetMetadata: StacGeoparquetMetadata | undefined;

  /// Set the id of a stac-geoparquet item that should be fetched from the
  /// parquet table and loaded into the picked item.
  setStacGeoparquetItemId: (id: string | undefined) => void;
}
