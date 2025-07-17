import { useMemo } from "react";
import useStacMap from "./stac-map";
import { isItemWithinDateRange } from "../utils/date-filter";
import type { DateRange } from "../components/date-filter";

function isDateRangeActive(dateRange: DateRange): boolean {
  return (
    dateRange.startDate !== null ||
    dateRange.endDate !== null ||
    dateRange.startTime !== undefined ||
    dateRange.endTime !== undefined
  );
}

export function useFilteredSearchItems() {
  const { searchItems, clientFilterDateRange } = useStacMap();

  return useMemo(() => {
    if (!isDateRangeActive(clientFilterDateRange)) {
      return searchItems;
    }

    return searchItems.map((page) =>
      page.filter((item) => isItemWithinDateRange(item, clientFilterDateRange)),
    );
  }, [searchItems, clientFilterDateRange]);
}

export function useFilteredCollections() {
  const { collections, clientFilterDateRange } = useStacMap();

  return useMemo(() => {
    if (!collections || !isDateRangeActive(clientFilterDateRange)) {
      return collections;
    }

    return collections.filter((collection) => {
      if (collection.extent?.temporal?.interval) {
        const intervals = collection.extent.temporal.interval;
        return intervals.some((interval) => {
          const [start, end] = interval;
          if (
            clientFilterDateRange.startDate &&
            end &&
            new Date(end) < clientFilterDateRange.startDate
          )
            return false;
          if (
            clientFilterDateRange.endDate &&
            start &&
            new Date(start) > clientFilterDateRange.endDate
          )
            return false;
          return true;
        });
      }
      return true;
    });
  }, [collections, clientFilterDateRange]);
}
