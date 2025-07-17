import type { DateRange } from "../components/date-filter";

export function serializeDateRange(dateRange: DateRange): string | null {
  if (!dateRange.startDate && !dateRange.endDate) return null;

  const params = new URLSearchParams();
  if (dateRange.startDate) {
    params.set("startDate", dateRange.startDate.toISOString());
  }
  if (dateRange.endDate) {
    params.set("endDate", dateRange.endDate.toISOString());
  }
  if (dateRange.startTime) {
    params.set("startTime", dateRange.startTime);
  }
  if (dateRange.endTime) {
    params.set("endTime", dateRange.endTime);
  }

  return params.toString();
}

export function deserializeDateRange(searchParams: URLSearchParams): DateRange {
  return {
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : null,
    endDate: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : null,
    startTime: searchParams.get("startTime") || undefined,
    endTime: searchParams.get("endTime") || undefined,
  };
}

export function serializeClientFilterDateRange(
  dateRange: DateRange,
): string | null {
  if (!dateRange.startDate && !dateRange.endDate) return null;

  const params = new URLSearchParams();
  if (dateRange.startDate) {
    params.set("clientStartDate", dateRange.startDate.toISOString());
  }
  if (dateRange.endDate) {
    params.set("clientEndDate", dateRange.endDate.toISOString());
  }
  if (dateRange.startTime) {
    params.set("clientStartTime", dateRange.startTime);
  }
  if (dateRange.endTime) {
    params.set("clientEndTime", dateRange.endTime);
  }

  return params.toString();
}

export function deserializeClientFilterDateRange(
  searchParams: URLSearchParams,
): DateRange {
  return {
    startDate: searchParams.get("clientStartDate")
      ? new Date(searchParams.get("clientStartDate")!)
      : null,
    endDate: searchParams.get("clientEndDate")
      ? new Date(searchParams.get("clientEndDate")!)
      : null,
    startTime: searchParams.get("clientStartTime") || undefined,
    endTime: searchParams.get("clientEndTime") || undefined,
  };
}
