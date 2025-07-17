import {
  Alert,
  Button,
  ButtonGroup,
  createListCollection,
  DownloadTrigger,
  Heading,
  HStack,
  IconButton,
  Portal,
  Progress,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuDownload, LuPause, LuPlay, LuSearch, LuX } from "react-icons/lu";
import type { StacCollection, StacLink } from "stac-ts";
import useStacMap from "../../hooks/stac-map";
import useStacSearch from "../../hooks/stac-search";
import type { StacSearch, StacValue } from "../../types/stac";
import DateFilter, { type DateRange } from "../date-filter";

export default function ItemSearch({
  value,
  defaultLink,
  links,
  dateRange,
  setDateRange,
  clearDateRange,
  isDateFilterActive,
}: {
  value: StacValue;
  defaultLink: StacLink;
  links: StacLink[];
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  clearDateRange: () => void;
  isDateFilterActive: boolean;
}) {
  const [search, setSearch] = useState<StacSearch>();
  const [link, setLink] = useState(defaultLink);
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [method, setMethod] = useState((defaultLink.method as string) || "GET");

  const methods =
    links.length > 1 &&
    createListCollection({
      items: links.map((link) => (link.method as string) || "GET"),
    });

  useEffect(() => {
    if (value?.type == "Collection") {
      setCollections([value]);
    }
  }, [value]);

  useEffect(() => {
    setLink(links.find((link) => link.method == method) || defaultLink);
  }, [method, defaultLink, links]);

  return (
    <Stack gap={4}>
      <Stack>
        <Text fontSize={"xs"} fontWeight={"light"}>
          Item search
        </Text>
        {value.type == "Collection" && (
          <Heading fontSize={"larger"}>{value.title || value.id}</Heading>
        )}
      </Stack>
      <DateFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        clearDateRange={clearDateRange}
        isDateFilterActive={isDateFilterActive}
        title="Search Date Filter"
        description="Filter items at the server level when searching"
      />
      <Alert.Root status={"warning"}>
        <Alert.Indicator></Alert.Indicator>
        <Alert.Content>
          <Alert.Description>
            Item search is under active development, and currently can't do very
            much.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      {methods && (
        <Select.Root
          width={"180px"}
          collection={methods}
          value={[method]}
          onValueChange={(e) => setMethod(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Label>Select search method</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Search method" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {methods.items.map((method) => (
                  <Select.Item item={method} key={method}>
                    {method}
                    <Select.ItemIndicator></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      )}
      <HStack>
        {!search && (
          <Button
            variant={"surface"}
            onClick={() =>
              setSearch({
                collections: collections.map((collection) => collection.id),
              })
            }
          >
            <LuSearch></LuSearch> Search
          </Button>
        )}
      </HStack>
      {search && (
        <SearchResults
          link={link}
          search={search}
          setSearch={setSearch}
        ></SearchResults>
      )}
    </Stack>
  );
}

function SearchResults({
  link,
  search,
  setSearch,
}: {
  link: StacLink;
  search: StacSearch;
  setSearch: (search: StacSearch | undefined) => void;
}) {
  const {
    data,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    isSuccess,
  } = useStacSearch(search, link);
  const [numberMatched, setNumberMatched] = useState<number>();
  const [value, setValue] = useState<number | null>(null);
  const { setSearchItems, setPicked, isDateFilterActive } = useStacMap();
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (data && !isFetchingNextPage) {
      setNumberMatched(data.pages[0].numberMatched);
      setSearchItems((current) =>
        current.concat(
          data.pages.slice(current.length).map((page) => page.features),
        ),
      );
      setValue(
        data.pages.map((page) => page.features.length).reduce((a, n) => a + n),
      );
    }
  }, [data, isFetchingNextPage, setSearchItems]);

  useEffect(() => {
    if (!isFetching) {
      if (hasNextPage) {
        if (!paused) {
          fetchNextPage();
        }
      }
    }
  }, [paused, isFetching, hasNextPage, fetchNextPage]);

  useEffect(() => {
    setDone(isSuccess && !hasNextPage);
  }, [isSuccess, hasNextPage]);

  const getItemCollection = () => {
    const items = data?.pages.flatMap((page) => page.features);
    return JSON.stringify({
      type: "FeatureCollection",
      features: items,
      id: "search",
      title: "Item search",
      links: [link],
    });
  };

  return (
    <>
      {isDateFilterActive && (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              Showing results filtered by date range
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      <Progress.Root value={value} max={numberMatched}>
        <Progress.Label>
          {(value && `Found ${value} item${value === 1 ? "" : "s"}`) ||
            "Searching..."}
        </Progress.Label>
        <HStack>
          <Progress.Track flex={"1"}>
            <Progress.Range></Progress.Range>
          </Progress.Track>
          <Progress.ValueText></Progress.ValueText>
        </HStack>
      </Progress.Root>
      <ButtonGroup variant={"subtle"}>
        {!done && !paused && (
          <IconButton onClick={() => setPaused(true)}>
            <LuPause></LuPause>
          </IconButton>
        )}
        {!done && paused && (
          <IconButton onClick={() => setPaused(false)}>
            <LuPlay></LuPlay>
          </IconButton>
        )}
        {(done || paused) && (
          <IconButton
            onClick={() => {
              setSearchItems([]);
              setSearch(undefined);
              setPicked(undefined);
            }}
          >
            <LuX></LuX>
          </IconButton>
        )}
        {done && (
          <DownloadTrigger
            data={getItemCollection}
            fileName="search.json"
            mimeType="application/json"
            asChild
          >
            <IconButton variant={"subtle"}>
              <LuDownload></LuDownload>
            </IconButton>
          </DownloadTrigger>
        )}
      </ButtonGroup>
    </>
  );
}
