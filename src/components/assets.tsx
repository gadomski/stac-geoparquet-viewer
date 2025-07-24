import {
  Badge,
  ButtonGroup,
  Card,
  HStack,
  Heading,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuDownload } from "react-icons/lu";
import type { StacAsset } from "stac-ts";

export default function Assets({
  assets,
}: {
  assets: { [k: string]: StacAsset };
}) {
  return (
    <Stack>
      <Heading size={"sm"}>Assets</Heading>
      {Object.entries(assets).map(([key, asset]) => (
        <Card.Root key={asset.href} size={"sm"}>
          <Card.Body>
            <Card.Title>
              <HStack>
                {asset.title || key}
                {asset.roles &&
                  asset.roles.map((role) => <Badge key={role}>{role}</Badge>)}
              </HStack>
            </Card.Title>
            {asset.description && (
              <Card.Description>{asset.description}</Card.Description>
            )}
          </Card.Body>
          <Card.Footer>
            <ButtonGroup size={"xs"} variant={"subtle"}>
              <IconButton asChild>
                <a href={asset.href} target="_blank">
                  <LuDownload></LuDownload>
                </a>
              </IconButton>
            </ButtonGroup>
            {asset.type && (
              <Text fontSize={"xs"} fontWeight={"light"}>
                {asset.type}
              </Text>
            )}
          </Card.Footer>
        </Card.Root>
      ))}
    </Stack>
  );
}
