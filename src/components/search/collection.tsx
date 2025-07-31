import { Combobox, createListCollection, Portal } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type { StacCollection } from "stac-ts";
import useStacMap from "../../hooks/stac-map";

export function CollectionCombobox({
  collections,
}: {
  collections: StacCollection[];
}) {
  const [searchValue, setSearchValue] = useState("");
  const { setHref } = useStacMap();

  const filteredCollections = useMemo(() => {
    return collections.filter(
      (collection) =>
        collection.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
        collection.id.toLowerCase().includes(searchValue.toLowerCase()) ||
        collection.description
          .toLowerCase()
          .includes(searchValue.toLowerCase()),
    );
  }, [searchValue, collections]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: filteredCollections,
        itemToString: (collection) => collection.title || collection.id,
        itemToValue: (collection) => collection.id,
      }),

    [filteredCollections],
  );

  return (
    <Combobox.Root
      collection={collection}
      multiple
      closeOnSelect
      onInputValueChange={(details) => setSearchValue(details.inputValue)}
      onSelect={(details) => {
        const collection = collections.find(
          (collection) => collection.id == details.itemValue,
        );
        if (collection) {
          const selfHref = collection.links.find(
            (link) => link.rel == "self",
          )?.href;
          if (selfHref) {
            setHref(selfHref);
          }
        }
      }}
    >
      <Combobox.Control>
        <Combobox.Input placeholder="Search collections by title, id, or description" />

        <Combobox.IndicatorGroup>
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.ItemGroup>
              {filteredCollections.map((collection) => (
                <Combobox.Item key={collection.id} item={collection}>
                  {collection.title || collection.id}

                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}

              <Combobox.Empty>No collections found</Combobox.Empty>
            </Combobox.ItemGroup>
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
