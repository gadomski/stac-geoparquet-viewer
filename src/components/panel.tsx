import { SkeletonText, Tabs, Accordion, HStack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  LuInfo,
  LuMousePointerClick,
  LuSearch,
  LuUpload,
  LuFilter,
} from "react-icons/lu";
import type { StacLink } from "stac-ts";
import useStacMap from "../hooks/stac-map";
import useStacValue from "../hooks/stac-value";
import ItemSearch from "./search/item";
import Upload from "./upload";
import Value from "./value";
import Filter from "./filter";

export default function Panel() {
  const {
    value,
    picked,
    dateRange,
    setDateRange,
    clearDateRange,
    isDateFilterActive,
    hasTemporalData,
  } = useStacMap();
  const [tab, setTab] = useState<string>("upload");
  const [itemSearchLinks, setItemSearchLinks] = useState<StacLink[]>([]);
  const { value: root } = useStacValue(
    value?.links?.find((link) => link.rel == "root")?.href,
  );

  useEffect(() => {
    if (value) {
      setTab("value");
    }
  }, [value]);

  useEffect(() => {
    if (picked) {
      setTab("picked");
    }
  }, [picked]);

  useEffect(() => {
    const links = [];
    if (root?.links) {
      links.push(...root.links.filter((link) => link.rel == "search"));
      if (links.length > 0) {
        setItemSearchLinks(links);
        return;
      }
    }
    setItemSearchLinks([]);
  }, [value, root]);

  return (
    <Tabs.Root
      bg={"bg.muted"}
      rounded={4}
      value={tab}
      onValueChange={(e) => setTab(e.value)}
    >
      <Tabs.List>
        <Tabs.Trigger value="value" disabled={!value}>
          <LuInfo></LuInfo>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="search"
          disabled={itemSearchLinks.length == 0 || value?.type !== "Collection"}
        >
          <LuSearch></LuSearch>
        </Tabs.Trigger>
        <Tabs.Trigger value="filter" disabled={!hasTemporalData}>
          <LuFilter></LuFilter>
        </Tabs.Trigger>
        <Tabs.Trigger value="picked" disabled={!picked}>
          <LuMousePointerClick></LuMousePointerClick>
        </Tabs.Trigger>
        <Tabs.Trigger value="upload">
          <LuUpload></LuUpload>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.ContentGroup overflow={"scroll"} maxH={"80dvh"} px={4} pb={4}>
        <Tabs.Content value="value">
          {(value && <Value value={value}></Value>) || (
            <SkeletonText noOfLines={3}></SkeletonText>
          )}
        </Tabs.Content>
        <Tabs.Content value="search">
          {value && itemSearchLinks.length > 0 && (
            <Accordion.Root
              variant="outline"
              size="sm"
              collapsible
              defaultValue={["item-search"]}
            >
              <Accordion.Item value="item-search">
                <Accordion.ItemTrigger>
                  <HStack justify="space-between" width="100%">
                    <Text fontSize="sm" fontWeight="medium">
                      Item Search
                    </Text>
                    <Accordion.ItemIndicator />
                  </HStack>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <ItemSearch
                      value={value}
                      links={itemSearchLinks}
                      defaultLink={itemSearchLinks[0]}
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                      clearDateRange={clearDateRange}
                      isDateFilterActive={isDateFilterActive}
                    />
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </Tabs.Content>
        <Tabs.Content value="filter">
          <Filter />
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
