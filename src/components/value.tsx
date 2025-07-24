import {
  Button,
  ButtonGroup,
  DataList,
  Heading,
  HStack,
  Image,
  Link,
  Stack,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuExternalLink } from "react-icons/lu";
import { MarkdownHooks } from "react-markdown";
import type { StacAsset } from "stac-ts";
import useStacMap from "../hooks/stac-map";
import useStacValue from "../hooks/stac-value";
import type { StacValue } from "../types/stac";
import Catalog from "./catalog";
import Collection from "./collection";
import Item from "./item";
import ItemCollection from "./item-collection";
import { Prose } from "./ui/prose";

export default function Value({ value }: { value: StacValue }) {
  switch (value.type) {
    case "Catalog":
      return <Catalog catalog={value}></Catalog>;
    case "Collection":
      return <Collection collection={value}></Collection>;
    case "Feature":
      return <Item item={value}></Item>;
    case "FeatureCollection":
      return <ItemCollection itemCollection={value}></ItemCollection>;
  }
}

export function ValueInfo({
  value,
  icon,
  type,
  children,
}: {
  value: StacValue;
  icon: ReactNode;
  type?: string;
  children?: ReactNode;
}) {
  const { setHref } = useStacMap();
  const thumbnailAsset =
    typeof value.assets === "object" &&
    value.assets &&
    "thumbnail" in value.assets &&
    (value.assets.thumbnail as StacAsset);
  const selfHref = value.links?.find((link) => link.rel == "self")?.href;
  const rootHref = value.links?.find((link) => link.rel == "root")?.href;
  const parentHref = value.links?.find((link) => link.rel == "parent")?.href;
  const { value: root } = useStacValue(rootHref);
  const { value: parent } = useStacValue(parentHref);

  return (
    <Stack>
      <HStack fontSize={"xs"} fontWeight={"light"}>
        {icon} {type || value.type}
      </HStack>
      <Stack gap={4}>
        <Heading fontSize={(value.title && "larger") || "small"}>
          {(value.title as string) ?? value.id ?? ""}
        </Heading>
        {((root && rootHref != selfHref) ||
          (parent && parentHref != rootHref)) && (
          <DataList.Root orientation={"horizontal"} size={"sm"}>
            {root && rootHref != selfHref && (
              <DataList.Item>
                <DataList.ItemLabel>Root</DataList.ItemLabel>
                <DataList.ItemValue>
                  <Link onClick={() => setHref(rootHref)}>
                    {(root.title as string | undefined) || root.id || ""}
                  </Link>
                </DataList.ItemValue>
              </DataList.Item>
            )}
            {parent && parentHref != rootHref && (
              <DataList.Item>
                <DataList.ItemLabel>Parent</DataList.ItemLabel>
                <DataList.ItemValue>
                  <Link onClick={() => setHref(parentHref)}>
                    {(parent.title as string | undefined) || parent.id || ""}
                  </Link>
                </DataList.ItemValue>
              </DataList.Item>
            )}
          </DataList.Root>
        )}
        {thumbnailAsset && (
          <Image
            maxH={"200px"}
            fit={"scale-down"}
            src={thumbnailAsset.href}
          ></Image>
        )}
        {!!value.description && (
          <Prose>
            <MarkdownHooks>{value.description as string}</MarkdownHooks>
          </Prose>
        )}
      </Stack>
      {children}
      <ButtonGroup size={"xs"} variant={"outline"}>
        {selfHref && (
          <>
            <Button asChild>
              <a href={selfHref} target="_blank">
                <LuExternalLink></LuExternalLink> Open
              </a>
            </Button>
            <Button asChild>
              <a
                href={
                  "https://radiantearth.github.io/stac-browser/#/external/" +
                  selfHref.replace(/^(https?:\/\/)/, "")
                }
                target="_blank"
              >
                <LuExternalLink></LuExternalLink> STAC Browser
              </a>
            </Button>
          </>
        )}
      </ButtonGroup>
    </Stack>
  );
}
