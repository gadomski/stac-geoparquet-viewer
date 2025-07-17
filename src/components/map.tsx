import { Layer, type DeckProps } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import turfBbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import type { BBox, Feature, FeatureCollection, GeoJSON } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Map as MaplibreMap,
  useControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StacCollection } from "stac-ts";
import useStacMap from "../hooks/stac-map";
import {
  useFilteredSearchItems,
  useFilteredCollections,
} from "../hooks/stac-filtered-data";
import { useColorModeValue } from "./ui/color-mode";

function DeckGLOverlay(props: DeckProps) {
  const control = useControl<MapboxOverlay>(() => new MapboxOverlay({}));
  control.setProps(props);
  return <></>;
}

const fillColor: [number, number, number, number] = [207, 63, 2, 50];
const lineColor: [number, number, number, number] = [207, 63, 2, 100];
// FIXME terrible and ugly
const inverseFillColor: [number, number, number, number] = [
  256 - 207,
  256 - 63,
  256 - 2,
  50,
];
const inverseLineColor: [number, number, number, number] = [
  256 - 207,
  256 - 63,
  256 - 2,
  100,
];

export default function Map() {
  const mapRef = useRef<MapRef>(null);
  const mapStyle = useColorModeValue(
    "positron-gl-style",
    "dark-matter-gl-style",
  );
  const {
    value,
    stacGeoparquetTable,
    stacGeoparquetMetadata,
    stacGeoparquetItem,
    setStacGeoparquetItemId,
    setPicked,
    picked,
  } = useStacMap();

  const filteredSearchItems = useFilteredSearchItems();
  const filteredCollections = useFilteredCollections();

  const [data, setData] = useState<GeoJSON | Feature[]>();
  const [visible, setVisible] = useState(true);
  const [filled, setFilled] = useState(true);
  const [pickable, setPickable] = useState(false);
  const [bbox, setBbbox] = useState<BBox>();
  const [stacGeoparquetLayer, setStacGeoparquetLayer] =
    useState<GeoArrowPolygonLayer>();

  useEffect(() => {
    switch (value?.type) {
      case "Catalog":
        setBbbox(
          filteredCollections && getCollectionsExtent(filteredCollections),
        );
        setData(
          filteredCollections &&
            filteredCollections.map((collection) =>
              bboxPolygon(collection.extent?.spatial?.bbox?.[0] as BBox),
            ),
        );
        setFilled(false);
        setPickable(false);
        break;
      case "Collection":
        setBbbox(value.extent?.spatial?.bbox?.[0] as BBox);
        setData(bboxPolygon(value.extent?.spatial?.bbox?.[0] as BBox));
        setFilled(true);
        setPickable(false);
        break;
      case "Feature":
        setBbbox(value.bbox as BBox);
        setData(value as Feature);
        setFilled(true);
        setPickable(false);
        break;
      case "FeatureCollection":
        setBbbox(
          (value.features.length > 0 && turfBbox(value as FeatureCollection)) ||
            undefined,
        );
        setData(value as FeatureCollection);
        setFilled(true);
        setPickable(true);
    }
  }, [value, filteredCollections]);

  useEffect(() => {
    if (stacGeoparquetTable) {
      setStacGeoparquetLayer(
        new GeoArrowPolygonLayer({
          id: "stac-geoparquet",
          data: stacGeoparquetTable,
          filled: true,
          stroked: true,
          getFillColor: (info) =>
            stacGeoparquetItem &&
            stacGeoparquetItem.id ==
              stacGeoparquetTable.getChild("id")?.get(info.index)
              ? inverseFillColor
              : fillColor,
          getLineColor: (info) =>
            stacGeoparquetItem &&
            stacGeoparquetItem.id ==
              stacGeoparquetTable.getChild("id")?.get(info.index)
              ? inverseLineColor
              : lineColor,
          lineWidthUnits: "pixels",
          getLineWidth: 2,
          autoHighlight: true,
          pickable: true,
          onClick: (info) => {
            setStacGeoparquetItemId(
              stacGeoparquetTable.getChild("id")?.get(info.index),
            );
          },
          updateTriggers: {
            getFillColor: [stacGeoparquetItem],
            getLineColor: [stacGeoparquetItem],
          },
        }),
      );
    } else {
      setStacGeoparquetLayer(undefined);
    }
  }, [stacGeoparquetTable, setStacGeoparquetItemId, stacGeoparquetItem]);

  useEffect(() => {
    if (stacGeoparquetMetadata?.bbox) {
      setBbbox(stacGeoparquetMetadata.bbox);
    }
  }, [stacGeoparquetMetadata?.bbox]);

  useEffect(() => {
    if (bbox && mapRef.current) {
      mapRef.current.fitBounds(sanitizeBbox(bbox), {
        linear: true,
        padding: {
          top: window.innerHeight / 10,
          bottom: window.innerHeight / 20,
          right: window.innerWidth / 20,
          // TODO fix for smaller viewport
          left: window.innerWidth / 20 + window.innerWidth / 3,
        },
      });
    }
  }, [bbox]);

  useEffect(() => {
    if (filteredSearchItems.length > 0) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, [filteredSearchItems]);

  const searchLayers = filteredSearchItems.map((items, index) => {
    return new GeoJsonLayer({
      id: `search-${index}`,
      data: items as Feature[],
      filled: true,
      stroked: true,
      getFillColor: (item) =>
        item.id === picked?.id ? inverseFillColor : fillColor,
      getLineColor: (item) =>
        item.id === picked?.id ? inverseLineColor : lineColor,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      pickable: true,
      onClick: (info) => {
        setPicked(info.object);
      },
      updateTriggers: {
        getFillColor: [picked],
        getLineColor: [picked],
      },
    });
  });
  const layers: Layer[] = [
    ...searchLayers,
    new GeoJsonLayer({
      id: "value",
      visible: visible,
      data,
      filled: filled,
      stroked: true,
      getFillColor: fillColor,
      getLineColor: lineColor,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      pickable,
    }),
  ];

  if (stacGeoparquetLayer) {
    layers.push(stacGeoparquetLayer);
  }

  return (
    <MaplibreMap
      id="map"
      ref={mapRef}
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 1,
      }}
      style={{
        height: "100dvh",
        width: "100dvw",
      }}
      mapStyle={`https://basemaps.cartocdn.com/gl/${mapStyle}/style.json`}
    >
      <DeckGLOverlay
        layers={layers}
        getCursor={(props) => getCursor(mapRef, props)}
      ></DeckGLOverlay>
    </MaplibreMap>
  );
}

function sanitizeBbox(bbox: number[]) {
  const newBbox = (bbox.length == 6 && [
    bbox[0],
    bbox[1],
    bbox[3],
    bbox[4],
  ]) || [bbox[0], bbox[1], bbox[2], bbox[3]];
  if (newBbox[0] < -180) {
    newBbox[0] = -180;
  }
  if (newBbox[1] < -90) {
    newBbox[1] = -90;
  }
  if (newBbox[2] > 180) {
    newBbox[2] = 180;
  }
  if (newBbox[3] > 90) {
    newBbox[3] = 90;
  }
  return newBbox as [number, number, number, number];
}

function getCollectionsExtent(collections: StacCollection[]): BBox {
  const validCollections = collections.filter(
    (collection) => collection.extent?.spatial?.bbox?.[0],
  );

  if (validCollections.length == 0) {
    return [-180, -90, 180, 90];
  }

  const bbox = [180, 90, -180, -90];
  validCollections.forEach((collection) => {
    const sanitizedBbox = sanitizeBbox(collection.extent.spatial.bbox[0]);
    if (sanitizedBbox[0] < bbox[0]) {
      bbox[0] = sanitizedBbox[0];
    }
    if (sanitizedBbox[1] < bbox[1]) {
      bbox[1] = sanitizedBbox[1];
    }
    if (sanitizedBbox[2] > bbox[2]) {
      bbox[2] = sanitizedBbox[2];
    }
    if (sanitizedBbox[3] > bbox[3]) {
      bbox[3] = sanitizedBbox[3];
    }
  });
  return bbox as BBox;
}

function getCursor(
  mapRef: RefObject<MapRef | null>,
  {
    isHovering,
    isDragging,
  }: {
    isHovering: boolean;
    isDragging: boolean;
  },
) {
  let cursor = "grab";
  if (isHovering) {
    cursor = "pointer";
  } else if (isDragging) {
    cursor = "grabbing";
  }
  if (mapRef.current) {
    mapRef.current.getCanvas().style.cursor = cursor;
  }
  return cursor;
}
