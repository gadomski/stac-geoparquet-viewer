import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  createListCollection,
  Field,
  Group,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Progress,
  Select,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuPause, LuPlay, LuSearch, LuX } from "react-icons/lu";
import type { StacCollection, StacLink, TemporalExtent } from "stac-ts";
import useStacMap from "../../hooks/stac-map";
import useStacSearch from "../../hooks/stac-search";
import type { StacSearch } from "../../types/stac";
import { toaster } from "../ui/toaster";

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
  const [datetime, setDatetime] = useState<string>();

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

      <Datetime
        interval={collection.extent?.temporal?.interval[0]}
        setDatetime={setDatetime}
      ></Datetime>

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
          onClick={() => setSearch({ collections: [collection.id], datetime })}
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
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
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

  useEffect(() => {
    if (error) {
      toaster.create({
        type: "error",
        title: "Search error",
        description: error.toString(),
      });
      doClear();
    }
  }, [error, doClear]);

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

function Datetime({
  interval,
  setDatetime,
}: {
  interval: TemporalExtent | undefined;
  setDatetime: (datetime: string | undefined) => void;
}) {
  const [startDatetime, setStartDatetime] = useState(
    interval?.[0] ? new Date(interval[0]) : undefined,
  );
  const [endDatetime, setEndDatetime] = useState(
    interval?.[1] ? new Date(interval[1]) : undefined,
  );

  useEffect(() => {
    if (startDatetime || endDatetime) {
      setDatetime(
        `${startDatetime?.toISOString() || ".."}/${endDatetime?.toISOString() || ".."}`,
      );
    } else {
      setDatetime(undefined);
    }
  }, [startDatetime, endDatetime, setDatetime]);

  return (
    <Stack>
      <DatetimeInput
        label="Start datetime"
        datetime={startDatetime}
        setDatetime={setStartDatetime}
      ></DatetimeInput>
      <DatetimeInput
        label="End datetime"
        datetime={endDatetime}
        setDatetime={setEndDatetime}
      ></DatetimeInput>
      <HStack>
        <Button
          variant={"outline"}
          onClick={() => {
            setStartDatetime(interval?.[0] ? new Date(interval[0]) : undefined);
            setEndDatetime(interval?.[1] ? new Date(interval[1]) : undefined);
          }}
        >
          Set to collection extents
        </Button>
      </HStack>
    </Stack>
  );
}

function DatetimeInput({
  label,
  datetime,
  setDatetime,
}: {
  label: string;
  datetime: Date | undefined;
  setDatetime: (datetime: Date | undefined) => void;
}) {
  const [error, setError] = useState<string>();
  const dateValue = datetime?.toISOString().split("T")[0] || "";
  const timeValue = datetime?.toISOString().split("T")[1].slice(0, 8) || "";

  const setDatetimeChecked = (datetime: Date) => {
    try {
      datetime.toISOString();
      // eslint-disable-next-line
    } catch (e: any) {
      setError(e.toString());
      return;
    }
    setDatetime(datetime);
    setError(undefined);
  };
  const setDate = (date: string) => {
    setDatetimeChecked(
      new Date(date + "T" + (timeValue == "" ? "00:00:00" : timeValue) + "Z"),
    );
  };
  const setTime = (time: string) => {
    if (dateValue != "") {
      const newDatetime = new Date(dateValue);
      const timeParts = time.split(":").map(Number);
      newDatetime.setUTCHours(timeParts[0]);
      newDatetime.setUTCMinutes(timeParts[1]);
      if (timeParts.length == 3) {
        newDatetime.setUTCSeconds(timeParts[2]);
      }
      setDatetimeChecked(newDatetime);
    }
  };

  return (
    <Field.Root invalid={!!error}>
      <Field.Label>{label}</Field.Label>
      <Group attached w={"full"}>
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => setDate(e.target.value)}
          size={"sm"}
        ></Input>
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => setTime(e.target.value)}
          size={"sm"}
        ></Input>
        <IconButton
          size={"sm"}
          variant={"outline"}
          onClick={() => setDatetime(undefined)}
        >
          <LuX></LuX>
        </IconButton>
      </Group>
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}
