import { useFileUpload } from "@chakra-ui/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StacItem } from "stac-ts";
import type { DateRange } from "./components/date-filter";
import { StacMapContext } from "./context";
import { useStacCollections } from "./hooks/stac-collections";
import useStacGeoparquet from "./hooks/stac-geoparquet";
import useStacValue from "./hooks/stac-value";
import { useDebounce } from "./hooks/use-debounce";
import type { StacValue } from "./types/stac";
import {
  createDateRangeFromTemporalExtent,
  extractTemporalExtent,
} from "./utils/date-filter";
import {
  deserializeClientFilterDateRange,
  deserializeDateRange,
  serializeClientFilterDateRange,
  serializeDateRange,
} from "./utils/url-persistence";

const DEBOUNCE_CLIENT_FILTER_UPDATE_DELAY = 200;

export function StacMapProvider({ children }: { children: ReactNode }) {
  const [href, setHref] = useState<string | undefined>(getInitialHref());
  const fileUpload = useFileUpload({ maxFiles: 1 });
  const { value, parquetPath } = useStacValue(href, fileUpload);
  const collections = useStacCollections(
    value?.links?.find((link) => link.rel == "data")?.href,
  );
  const [stacGeoparquetItemId, setStacGeoparquetItemId] = useState<string>();

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const params = new URLSearchParams(location.search);
    const dateRangeParam = params.get("dateRange");
    if (dateRangeParam) {
      return deserializeDateRange(new URLSearchParams(dateRangeParam));
    }
    return {
      startDate: null,
      endDate: null,
      startTime: undefined,
      endTime: undefined,
    };
  });

  const [clientFilterDateRange, setClientFilterDateRange] = useState<DateRange>(
    () => {
      const params = new URLSearchParams(location.search);
      const clientFilterParam = params.get("clientFilter");
      if (clientFilterParam) {
        return deserializeClientFilterDateRange(
          new URLSearchParams(clientFilterParam),
        );
      }
      return {
        startDate: null,
        endDate: null,
        startTime: undefined,
        endTime: undefined,
      };
    },
  );

  const debouncedClientFilterUpdate = useDebounce((dateRange: unknown) => {
    if (
      typeof dateRange === "object" &&
      dateRange !== null &&
      "startDate" in dateRange &&
      "endDate" in dateRange
    ) {
      updateClientFilterUrl(dateRange as DateRange);
    }
  }, DEBOUNCE_CLIENT_FILTER_UPDATE_DELAY);

  const [debouncedStacGeoparquetParams, setDebouncedStacGeoparquetParams] =
    useState({
      path: parquetPath,
      id: stacGeoparquetItemId,
      dateRange: clientFilterDateRange,
    });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedStacGeoparquetParams({
        path: parquetPath,
        id: stacGeoparquetItemId,
        dateRange: clientFilterDateRange,
      });
    }, DEBOUNCE_CLIENT_FILTER_UPDATE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [parquetPath, stacGeoparquetItemId, clientFilterDateRange]);

  const {
    table: stacGeoparquetTable,
    metadata: stacGeoparquetMetadata,
    item: stacGeoparquetItem,
  } = useStacGeoparquet(debouncedStacGeoparquetParams);

  const [picked, setPicked] = useState<StacValue>();
  const [searchItems, setSearchItems] = useState<StacItem[][]>([]);

  const clearDateRange = useCallback(() => {
    setDateRange({
      startDate: null,
      endDate: null,
      startTime: undefined,
      endTime: undefined,
    });
  }, []);

  const clearClientFilterDateRange = useCallback(() => {
    setClientFilterDateRange({
      startDate: null,
      endDate: null,
      startTime: undefined,
      endTime: undefined,
    });
  }, []);

  const isDateFilterActive = useMemo(() => {
    return (
      dateRange.startDate !== null ||
      dateRange.endDate !== null ||
      dateRange.startTime !== undefined ||
      dateRange.endTime !== undefined
    );
  }, [dateRange]);

  const isClientFilterActive = useMemo(() => {
    return (
      clientFilterDateRange.startDate !== null ||
      clientFilterDateRange.endDate !== null ||
      clientFilterDateRange.startTime !== undefined ||
      clientFilterDateRange.endTime !== undefined
    );
  }, [clientFilterDateRange]);

  const updateClientFilterUrl = useCallback((dateRange: DateRange) => {
    const params = new URLSearchParams(location.search);
    const clientFilterParam = serializeClientFilterDateRange(dateRange);

    if (clientFilterParam) {
      params.set("clientFilter", clientFilterParam);
    } else {
      params.delete("clientFilter");
    }

    const newUrl = `${location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setHref(new URLSearchParams(location.search).get("href") ?? "");
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (href) {
      if (new URLSearchParams(location.search).get("href") != href) {
        history.pushState(null, "", "?href=" + href);
      }
    }
    setSearchItems([]);
  }, [href]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateRangeParam = serializeDateRange(dateRange);

    if (dateRangeParam) {
      params.set("dateRange", dateRangeParam);
    } else {
      params.delete("dateRange");
    }

    const newUrl = `${location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
  }, [dateRange]);

  useEffect(() => {
    debouncedClientFilterUpdate(clientFilterDateRange);
  }, [clientFilterDateRange, debouncedClientFilterUpdate]);

  useEffect(() => {
    if (fileUpload.acceptedFiles.length == 1) {
      setHref(fileUpload.acceptedFiles[0].name);
    }
  }, [fileUpload.acceptedFiles]);

  useEffect(() => {
    setPicked(stacGeoparquetItem);
  }, [stacGeoparquetItem]);

  useEffect(() => {
    if (value) {
      const temporalDateRange = createDateRangeFromTemporalExtent(value);
      if (temporalDateRange) {
        setDateRange(temporalDateRange);
      } else {
        clearDateRange();
      }
    }
  }, [value, clearDateRange]);

  const hasTemporalData = useMemo(() => {
    if (stacGeoparquetMetadata?.temporalExtent) return true;

    if (picked) return !!extractTemporalExtent(picked);
    if (value) return !!extractTemporalExtent(value);
    return false;
  }, [picked, value, stacGeoparquetMetadata]);

  const contextValue = {
    href,
    setHref,
    fileUpload,
    value,
    collections,
    picked,
    setPicked,

    stacGeoparquetTable,
    stacGeoparquetMetadata,
    setStacGeoparquetItemId,
    stacGeoparquetItem,

    searchItems,
    setSearchItems,

    dateRange,
    setDateRange,
    clearDateRange,
    isDateFilterActive,

    clientFilterDateRange,
    setClientFilterDateRange,
    clearClientFilterDateRange,
    isClientFilterActive,
    hasTemporalData,
  };

  return (
    <StacMapContext.Provider value={contextValue}>
      {children}
    </StacMapContext.Provider>
  );
}

function getInitialHref() {
  const href = new URLSearchParams(location.search).get("href") || "";
  try {
    new URL(href);
  } catch {
    return undefined;
  }
  return href;
}
