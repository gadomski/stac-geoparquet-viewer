import {
  CloseButton,
  Field,
  Input,
  InputGroup,
  SkeletonText,
  Stack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LuSearch } from "react-icons/lu";
import type { StacCollection } from "stac-ts";
import type { NaturalLanguageCollectionSearchResult } from "../../types/stac";
import { CollectionCard } from "../collection";

export function NaturalLanguageCollectionSearch({
  href,
  collections,
}: {
  href: string;
  collections: StacCollection[];
}) {
  const [query, setQuery] = useState<string | undefined>();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const endElement = value ? (
    <CloseButton
      size="xs"
      onClick={() => {
        setValue("");
        setQuery(undefined);
        inputRef.current?.focus();
      }}
      me="-2"
    />
  ) : undefined;

  return (
    <Stack gap={4}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(value);
        }}
      >
        <Field.Root>
          <InputGroup
            startElement={<LuSearch></LuSearch>}
            endElement={endElement}
          >
            <Input
              size={"sm"}
              placeholder="Find collections that..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            ></Input>
          </InputGroup>
          <Field.HelperText>
            Natural language collection search is experimental, and can be
            rather slow.
          </Field.HelperText>
        </Field.Root>
      </form>
      {query && (
        <Results query={query} href={href} collections={collections}></Results>
      )}
    </Stack>
  );
}

function Results({
  query,
  href,
  collections,
}: {
  query: string;
  href: string;
  collections: StacCollection[];
}) {
  const [results, setResults] = useState<
    {
      collection: StacCollection | undefined;
      result: NaturalLanguageCollectionSearchResult;
    }[]
  >();
  const { data } = useQuery<{
    results: NaturalLanguageCollectionSearchResult[];
  }>({
    queryKey: [href, query],
    queryFn: async () => {
      const body = JSON.stringify({
        query,
        catalog_url: href,
      });
      const url = new URL(
        "search",
        import.meta.env.VITE_STAC_NATURAL_QUERY_API,
      );
      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }).then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(
            `Error while doing a natural language search against ${href}: ${response.statusText}`,
          );
        }
      });
    },
  });

  useEffect(() => {
    if (data) {
      setResults(
        data.results.map((result: NaturalLanguageCollectionSearchResult) => {
          return {
            result,
            collection: collections.find(
              (collection) => collection.id == result.collection_id,
            ),
          };
        }),
      );
    } else {
      setResults(undefined);
    }
  }, [data, collections]);

  if (results) {
    return results.map((result) => {
      if (result.collection) {
        return (
          <CollectionCard
            collection={result.collection}
            key={result.collection.id}
            explanation={result.result.explanation}
          ></CollectionCard>
        );
      } else {
        return null;
      }
    });
  } else {
    return <SkeletonText></SkeletonText>;
  }
}
