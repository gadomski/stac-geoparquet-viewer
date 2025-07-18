import { Card, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { MarkdownHooks } from "react-markdown";
import type { StacCollection } from "stac-ts";
import useStacMap from "../hooks/stac-map";

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

function CollectionCard({ collection }: { collection: StacCollection }) {
  const { setHref } = useStacMap();
  const selfHref = collection.links.find((link) => link.rel === "self")?.href;

  return (
    <Card.Root size={"sm"}>
      <Card.Body>
        <Card.Title>
          <Link onClick={() => selfHref && setHref(selfHref)}>
            {collection.title || collection.id}
          </Link>
        </Card.Title>
        <Card.Description>
          <Text lineClamp={2}>
            <MarkdownHooks>{collection.description}</MarkdownHooks>
          </Text>
        </Card.Description>
      </Card.Body>
    </Card.Root>
  );
}
