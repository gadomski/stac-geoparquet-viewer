import { useFileUpload } from "@chakra-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import type { StacItem } from "stac-ts";
import { StacMapContext } from "./context";
import { useStacCollections } from "./hooks/stac-collections";
import useStacGeoparquet from "./hooks/stac-geoparquet";
import useStacValue from "./hooks/stac-value";

export function StacMapProvider({ children }: { children: ReactNode }) {
  const [href, setHref] = useState<string | undefined>(getInitialHref());
  const fileUpload = useFileUpload({ maxFiles: 1 });
  const { value, parquetPath } = useStacValue(href, fileUpload);
  const collections = useStacCollections(value);
  const [items, setItems] = useState<StacItem[]>();
  const {
    table: stacGeoparquetTable,
    metadata: stacGeoparquetMetadata,
    setId: setStacGeoparquetItemId,
    item: stacGeoparquetItem,
  } = useStacGeoparquet(parquetPath);
  const [picked, setPicked] = useState<StacItem>();

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

  return (
    <StacMapContext.Provider
      value={{
        href,
        setHref,
        fileUpload,
        value,
        collections,
        items,
        setItems,
        picked,
        setPicked,
        stacGeoparquetTable,
        stacGeoparquetMetadata,
        setStacGeoparquetItemId,
      }}
    >
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
