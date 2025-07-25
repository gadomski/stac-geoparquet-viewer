import type { StacItem } from "stac-ts";
import type { DateRange, DateFilterPreset } from "../components/date-filter";
import type { StacValue } from "../types/stac";

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

export function isItemWithinDateRange(
  item: StacItem,
  dateRange: DateRange,
): boolean {
  if (!dateRange.startDate && !dateRange.endDate) return true;

  const itemStart =
    item.properties?.datetime || item.properties?.start_datetime;
  const itemEnd = item.properties?.datetime || item.properties?.end_datetime;

  if (!itemStart && !itemEnd) return false;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  const itemStartDate = itemStart ? new Date(itemStart) : null;
  const itemEndDate = itemEnd ? new Date(itemEnd) : null;

  if (effectiveStartDate && itemEndDate && itemEndDate < effectiveStartDate)
    return false;
  if (effectiveEndDate && itemStartDate && itemStartDate > effectiveEndDate)
    return false;

  return true;
}

export function formatDateRangeForStacSearch(
  dateRange: DateRange,
): string | null {
  if (!dateRange.startDate && !dateRange.endDate) return null;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  const start = effectiveStartDate?.toISOString() || "..";
  const end = effectiveEndDate?.toISOString() || "..";

  return `${start}/${end}`;
}

export function parseDateTime(dateString: string, timeString?: string): Date {
  const date = new Date(dateString);
  if (timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

export function isValidDateRange(dateRange: DateRange): boolean {
  if (!dateRange.startDate && !dateRange.endDate) return true;

  const effectiveStartDate = getEffectiveStartDateTime(dateRange);
  const effectiveEndDate = getEffectiveEndDateTime(dateRange);

  if (effectiveStartDate && effectiveEndDate) {
    return effectiveStartDate <= effectiveEndDate;
  }
  return true;
}

export const DATE_FILTER_PRESETS: DateFilterPreset[] = [
  {
    id: "last24h",
    label: "Last 24 hours",
    getDateRange: () => ({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }),
  },
  {
    id: "last7d",
    label: "Last 7 days",
    getDateRange: () => ({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }),
  },
  {
    id: "last30d",
    label: "Last 30 days",
    getDateRange: () => ({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    }),
  },
  {
    id: "thisYear",
    label: "This year",
    getDateRange: () => ({
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    }),
  },
];
export function extractTemporalExtent(
  value: StacValue,
): { start: Date; end: Date } | null {
  if (!value) return null;

  switch (value.type) {
    case "Collection":
      if (value.extent?.temporal?.interval?.[0]) {
        const [start, end] = value.extent.temporal.interval[0];
        if (start && end) {
          return {
            start: new Date(start),
            end: new Date(end),
          };
        }
      }
      break;

    case "Feature": {
      const datetime = value.properties?.datetime;
      if (datetime) {
        const date = new Date(datetime);
        return {
          start: date,
          end: date,
        };
      }
      break;
    }

    case "FeatureCollection":
      if (value.features.length > 0) {
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        value.features.forEach((item) => {
          const datetime = item.properties?.datetime;
          if (datetime) {
            const date = new Date(datetime);
            if (!minDate || date < minDate) {
              minDate = date;
            }
            if (!maxDate || date > maxDate) {
              maxDate = date;
            }
          }
        });

        if (minDate && maxDate) {
          return {
            start: minDate,
            end: maxDate,
          };
        }
      }
      break;

    case "Catalog":
      break;
  }

  return null;
}

export function createDateRangeFromTemporalExtent(
  value: StacValue,
): DateRange | null {
  const temporalExtent = extractTemporalExtent(value);
  if (!temporalExtent) return null;

  return {
    startDate: temporalExtent.start,
    endDate: temporalExtent.end,
    startTime: undefined,
    endTime: undefined,
  };
}
