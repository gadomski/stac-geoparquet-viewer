import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Menu,
  Portal,
  Span,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useStacMap from "../hooks/stac-map";
import { ColorModeButton } from "./ui/color-mode";

const EXAMPLES = [
  ["eoAPI DevSeed", "API", "https://stac.eoapi.dev/"],
  [
    "Microsoft Planetary Computer",
    "API",
    "https://planetarycomputer.microsoft.com/api/stac/v1",
  ],
  [
    "Earth Search by Element 84",
    "API",
    "https://earth-search.aws.element84.com/v1",
  ],
  ["NASA VEDA", "API", "https://openveda.cloud/api/stac"],
  [
    "Colorado NAIP",
    "stac-geoparquet",
    "https://raw.githubusercontent.com/developmentseed/labs-375-stac-geoparquet-backend/refs/heads/main/data/naip.parquet",
  ],
  [
    "Simple item",
    "item",
    "https://raw.githubusercontent.com/radiantearth/stac-spec/refs/heads/master/examples/simple-item.json",
  ],
];

export default function Header() {
  return (
    <HStack>
      <HrefInput></HrefInput>
      <Examples></Examples>
      <ColorModeButton></ColorModeButton>
    </HStack>
  );
}

function HrefInput() {
  const { href, setHref } = useStacMap();
  const [value, setValue] = useState(href || "");

  useEffect(() => {
    if (href) {
      setValue(href);
    }
  }, [href]);

  return (
    <Box
      as={"form"}
      onSubmit={(e) => {
        e.preventDefault();
        setHref(value);
      }}
      w={"full"}
    >
      <Input
        bg={"bg.muted/90"}
        placeholder="Enter a STAC JSON or GeoParquet url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      ></Input>
    </Box>
  );
}

function Examples() {
  const { setHref } = useStacMap();

  return (
    <Menu.Root onSelect={(details) => setHref(details.value)}>
      <Menu.Trigger asChild>
        <Button variant={"surface"} bg={"bg.muted/60"}>
          Examples
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {EXAMPLES.map(([text, badge, href], index) => (
              <Menu.Item key={"example-" + index} value={href}>
                {text}
                <Span flex={1}></Span>
                <Badge>{badge}</Badge>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
