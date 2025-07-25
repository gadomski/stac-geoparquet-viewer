import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  createListCollection,
  Heading,
  HStack,
  IconButton,
  Portal,
  Progress,
  Select,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuPause, LuPlay, LuSearch, LuX } from "react-icons/lu";
import type { StacCollection, StacLink } from "stac-ts";
import useStacMap from "../../hooks/stac-map";
import useStacSearch from "../../hooks/stac-search";
import type { StacSearch } from "../../types/stac";

export default function ItemSearch({
  collection,
  links,
}: {
  collection: StacCollection;
  links: StacLink[];
}) {
  const { setItems, setPicked } = useStacMap();
  const [search, setSearch] = useState<StacSearch>();
  const [link, setLink] = useState<StacLink | undefined>(links[0]);

  useEffect(() => {
    if (!search) {
      setItems(undefined);
      setPicked(undefined);
    }
  }, [search, setItems, setPicked]);

  const methods = createListCollection({
    items: links.map((link) => {
      return {
        label: (link.method as string) || "GET",
        value: (link.method as string) || "GET",
      };
    }),
  });

  return (
    <Stack gap={4}>
      <Heading>Item search</Heading>

      <Alert.Root status={"warning"} size={"sm"}>
        <Alert.Indicator></Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Under construction</Alert.Title>
          <Alert.Description>
            Item search is under active development and is relatively
            under-powered at the moment.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <HStack>
        <Box flex={1}></Box>

        <Select.Root
          collection={methods}
          value={[link?.method as string]}
          onValueChange={(e) =>
            setLink(links.find((link) => (link.method || "GET") == e.value))
          }
          disabled={!!search}
          maxW={100}
        >
          <Select.HiddenSelect></Select.HiddenSelect>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select search method" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {methods.items.map((method) => (
                  <Select.Item item={method} key={method.value}>
                    {method.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        <Button
          variant={"surface"}
          onClick={() => setSearch({ collections: [collection.id] })}
          disabled={!!search}
        >
          <LuSearch></LuSearch>
          Search
        </Button>
      </HStack>

      {search && link && (
        <Results
          search={search}
          link={link}
          doClear={() => setSearch(undefined)}
        ></Results>
      )}
    </Stack>
  );
}

function Results({
  search,
  link,
  doClear,
}: {
  search: StacSearch;
  link: StacLink;
  doClear: () => void;
}) {
  const { items, setItems } = useStacMap();
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useStacSearch(search, link);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    setItems(data?.pages.flatMap((page) => page.features));
  }, [data, setItems]);

  useEffect(() => {
    if (!isFetchingNextPage && !pause && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, pause, hasNextPage, fetchNextPage]);

  return (
    <Progress.Root
      value={items ? items.length : null}
      max={data?.pages[0]?.numberMatched}
      maxW={"md"}
    >
      <HStack>
        <Progress.Track flex={1}>
          <Progress.Range></Progress.Range>
        </Progress.Track>
        <Progress.ValueText>
          <HStack gap={2}>
            {items?.length || "0"}

            <ButtonGroup size={"xs"} variant={"subtle"} attached>
              {(pause && (
                <IconButton onClick={() => setPause(false)}>
                  <LuPlay></LuPlay>
                </IconButton>
              )) || (
                <IconButton
                  disabled={!hasNextPage}
                  onClick={() => setPause(true)}
                >
                  <LuPause></LuPause>
                </IconButton>
              )}
              <IconButton onClick={doClear}>
                <LuX></LuX>
              </IconButton>
            </ButtonGroup>
          </HStack>
        </Progress.ValueText>
      </HStack>
    </Progress.Root>
  );
}
