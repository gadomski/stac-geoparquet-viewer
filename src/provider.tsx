import { useFileUpload } from "@chakra-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import type { StacItem } from "stac-ts";
import { StacMapContext } from "./context";
import { useStacCollections } from "./hooks/stac-collections";
import useStacGeoparquet from "./hooks/stac-geoparquet";
import useStacValue from "./hooks/stac-value";
import type { StacValue } from "./types/stac";

export function StacMapProvider({ children }: { children: ReactNode }) {
  const [href, setHref] = useState<string | undefined>(getInitialHref());
  const fileUpload = useFileUpload({ maxFiles: 1 });
  const { value, parquetPath } = useStacValue(href, fileUpload);
  const collections = useStacCollections(
    value?.links?.find((link) => link.rel == "data")?.href,
  );
  const [stacGeoparquetItemId, setStacGeoparquetItemId] = useState<string>();
  const {
    table: stacGeoparquetTable,
    metadata: stacGeoparquetMetadata,
    item: stacGeoparquetItem,
  } = useStacGeoparquet({ path: parquetPath, id: stacGeoparquetItemId });
  const [picked, setPicked] = useState<StacValue>();
  const [searchItems, setSearchItems] = useState<StacItem[][]>([]);

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
    // It should never be more than 1.
    if (fileUpload.acceptedFiles.length == 1) {
      setHref(fileUpload.acceptedFiles[0].name);
    }
  }, [fileUpload.acceptedFiles]);

  useEffect(() => {
    setPicked(stacGeoparquetItem);
  }, [stacGeoparquetItem]);

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
