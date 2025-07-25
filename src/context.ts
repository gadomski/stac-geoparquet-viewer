import type { UseFileUploadReturn } from "@chakra-ui/react";
import type { Table } from "apache-arrow";
import type { BBox } from "geojson";
import { createContext, type Dispatch, type SetStateAction } from "react";
import type { StacCollection, StacItem } from "stac-ts";
import type { DateRange } from "./components/date-filter";
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

  // Server-side search filtering properties
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  clearDateRange: () => void;
  isDateFilterActive: boolean;

  // Client-side filtering properties
  clientFilterDateRange: DateRange;
  setClientFilterDateRange: (dateRange: DateRange) => void;
  clearClientFilterDateRange: () => void;
  isClientFilterActive: boolean;

  hasTemporalData: boolean;

  viewportBounds: BBox | undefined;
  setViewportBounds: (bounds: BBox | undefined) => void;
  isViewportBoundsActive: boolean;
}
