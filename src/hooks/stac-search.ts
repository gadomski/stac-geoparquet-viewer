import { useInfiniteQuery } from "@tanstack/react-query";
import type { StacLink } from "stac-ts";
import type { StacItemCollection, StacSearch } from "../types/stac";

export default function useStacSearch(search: StacSearch, link: StacLink) {
  return useInfiniteQuery({
    queryKey: ["search", search, link],
    initialPageParam: updateLink(link, search),
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
  }).then(async (response) => {
    if (response.ok) {
      return response.json();
    } else {
      const text = await response.text();
      throw new Error(
        `Could not ${pageParam.method || "GET"} ${pageParam.href}: ${response.statusText}: ${text}`,
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
    if (search.bbox) {
      url.searchParams.set("bbox", search.bbox.join(","));
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
