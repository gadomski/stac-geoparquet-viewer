import { SkeletonText, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  LuInfo,
  LuMousePointerClick,
  LuSearch,
  LuUpload,
} from "react-icons/lu";
import type { StacLink } from "stac-ts";
import useStacMap from "../hooks/stac-map";
import useStacValue from "../hooks/stac-value";
import ItemSearch from "./search/item";
import { NaturalLanguageCollectionSearch } from "./search/natural-language";
import Upload from "./upload";
import Value from "./value";

export default function Panel() {
  const { href, value, picked, collections } = useStacMap();
  const [tab, setTab] = useState<string>("upload");
  const [search, setSearch] = useState(false);
  const [catalogHref, setCatalogHref] = useState<string>();
  const [rootHref, setRootHref] = useState<string>();
  const { value: root } = useStacValue(rootHref);
  const [searchLinks, setSearchLinks] = useState<StacLink[]>();

  useEffect(() => {
    if (href) {
      setTab("value");
    }
  }, [href]);

  useEffect(() => {
    if (picked) {
      setTab("picked");
    }
  }, [picked]);

  useEffect(() => {
    if (value?.type == "Catalog") {
      setCatalogHref(value.links.find((link) => link.rel == "self")?.href);
    } else {
      setCatalogHref(undefined);
    }

    if (value?.type == "Collection") {
      setRootHref(value.links.find((link) => link.rel == "root")?.href);
    } else {
      setRootHref(undefined);
    }
  }, [value]);

  useEffect(() => {
    if (root) {
      setSearchLinks(root.links?.filter((link) => link.rel == "search"));
    } else {
      setSearchLinks(undefined);
    }
  }, [root]);

  useEffect(() => {
    setSearch(!!catalogHref || !!(searchLinks && searchLinks.length > 0));
  }, [catalogHref, searchLinks]);

  return (
    <Tabs.Root
      bg={"bg.muted"}
      rounded={4}
      value={tab}
      onValueChange={(e) => setTab(e.value)}
      pointerEvents={"auto"}
    >
      <Tabs.List>
        <Tabs.Trigger value="value" disabled={!href}>
          <LuInfo></LuInfo>
        </Tabs.Trigger>
        <Tabs.Trigger value="search" disabled={!search}>
          <LuSearch></LuSearch>
        </Tabs.Trigger>
        <Tabs.Trigger value="picked" disabled={!picked}>
          <LuMousePointerClick></LuMousePointerClick>
        </Tabs.Trigger>
        <Tabs.Trigger value="upload">
          <LuUpload></LuUpload>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.ContentGroup
        overflow={"scroll"}
        maxH={{ base: "40dvh", md: "80dvh" }}
        px={4}
        pb={4}
      >
        <Tabs.Content value="value">
          {(value && <Value value={value}></Value>) || (
            <SkeletonText noOfLines={3}></SkeletonText>
          )}
        </Tabs.Content>
        <Tabs.Content value="search">
          {catalogHref && collections && (
            <NaturalLanguageCollectionSearch
              collections={collections}
              href={catalogHref}
            ></NaturalLanguageCollectionSearch>
          )}
          {searchLinks && value && value.type == "Collection" && (
            <ItemSearch collection={value} links={searchLinks}></ItemSearch>
          )}
        </Tabs.Content>
        <Tabs.Content value="picked">
          {picked && <Value value={picked}></Value>}
        </Tabs.Content>
        <Tabs.Content value="upload">
          <Upload></Upload>
        </Tabs.Content>
      </Tabs.ContentGroup>
    </Tabs.Root>
  );
}
