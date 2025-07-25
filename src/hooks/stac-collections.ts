import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { StacCollections, StacValue } from "../types/stac";

export function useStacCollections(value: StacValue | undefined) {
  const href = value?.links?.find((link) => link.rel == "data")?.href;
  const { data, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery<StacCollections | null>({
      queryKey: ["collections", href],
      enabled: !!href,
      queryFn: async ({ pageParam }) => {
        if (pageParam) {
          // @ts-expect-error Not worth templating stuff
          return await getCollections(pageParam);
        } else {
          return null;
        }
      },
      initialPageParam: href,
      getNextPageParam: (lastPage: StacCollections | null) =>
        lastPage?.links?.find((link) => link.rel == "next")?.href,
    });

  useEffect(() => {
    if (!isFetching && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetching, hasNextPage, fetchNextPage]);

  return data?.pages.flatMap((page) => page?.collections || []);
}

async function getCollections(href: string): Promise<StacCollections> {
  return await fetch(href, {
    method: "GET",
    headers: { Accept: "application/json" },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(
        `Could not GET collections at ${href}: ${response.statusText}`,
      );
    }
  });
}
