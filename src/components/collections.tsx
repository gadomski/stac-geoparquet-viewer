import { Heading, Stack } from "@chakra-ui/react";
import type { StacCollection } from "stac-ts";
import { CollectionCard } from "./collection";

export default function Collections({
  collections,
}: {
  collections: StacCollection[];
}) {
  return (
    <Stack>
      <Heading size={"md"}>Collections</Heading>
      <Stack>
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
          ></CollectionCard>
        ))}
      </Stack>
    </Stack>
  );
}
