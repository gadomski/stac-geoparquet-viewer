import type { UseFileUploadReturn } from "@chakra-ui/react";
import type { Table } from "apache-arrow";
import { createContext, type Dispatch, type SetStateAction } from "react";
import type { StacCollection, StacItem } from "stac-ts";
import type { StacGeoparquetMetadata, StacValue } from "./types/stac";

export const StacMapContext = createContext<StacMapContextType | null>(null);

interface StacMapContextType {
  href: string | undefined;
  setHref: (href: string | undefined) => void;
  fileUpload: UseFileUploadReturn;
  value: StacValue | undefined;
  collections: StacCollection[] | undefined;
  picked: StacValue | undefined;
  setPicked: (value: StacValue | undefined) => void;

  stacGeoparquetTable: Table | undefined;
  stacGeoparquetMetadata: StacGeoparquetMetadata | undefined;
  setStacGeoparquetItemId: (id: string | undefined) => void;
  stacGeoparquetItem: StacItem | undefined;

  searchItems: StacItem[][];
  setSearchItems: Dispatch<SetStateAction<StacItem[][]>>;
}
