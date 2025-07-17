import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { StacLink } from "stac-ts";
import type { StacItemCollection, StacSearch } from "../types/stac";
import { formatDateRangeForStacSearch } from "../utils/date-filter";
import useStacMap from "./stac-map";

export default function useStacSearch(search: StacSearch, link: StacLink) {
  const { dateRange } = useStacMap();

  const searchWithDateRange = useMemo(() => {
    const datetime = formatDateRangeForStacSearch(dateRange);
    return datetime ? { ...search, datetime } : search;
  }, [search, dateRange]);

  return useInfiniteQuery({
    queryKey: ["search", searchWithDateRange, link, dateRange],
    initialPageParam: updateLink(link, searchWithDateRange),
    getNextPageParam: (lastPage: StacItemCollection) =>
      lastPage.links?.find((link) => link.rel == "next"),
    queryFn: fetchSearch,
  });
}

async function fetchSearch({ pageParam }: { pageParam: StacLink }) {
  return await fetch(pageParam.href, {
    method: (pageParam.method as string) || "GET",
    headers: {
      Accept: "application/json",
      "Content-type": "application/json",
    },
    body: (pageParam.body as StacSearch) && JSON.stringify(pageParam.body),
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(
        `Could not ${pageParam.method || "GET"} ${pageParam.href}: ${response.statusText}`,
      );
    }
  });
}

function updateLink(link: StacLink, search: StacSearch) {
  if (!link.method) {
    link.method = "GET";
  }
  const url = new URL(link.href);
  if (link.method == "GET") {
    if (search.collections) {
      url.searchParams.set("collections", search.collections.join(","));
    }
    if (search.datetime) {
      url.searchParams.set("datetime", search.datetime);
    }
  } else {
    link.body = search;
  }
  link.href = url.toString();
  return link;
}
