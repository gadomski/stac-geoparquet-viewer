import { useBreakpointValue } from "@chakra-ui/react";
import { Layer, type DeckProps } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import bboxPolygon from "@turf/bbox-polygon";
import { featureCollection } from "@turf/helpers";
import type {
  BBox,
  Feature,
  FeatureCollection,
  GeoJSON,
  Polygon,
} from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Map as MaplibreMap,
  useControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StacCollection } from "stac-ts";
import useStacMap from "../hooks/stac-map";
import type { StacValue } from "../types/stac";
import { useColorModeValue } from "./ui/color-mode";

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
    collections,
    items,
    picked,
    setPicked,
    stacGeoparquetTable,
    stacGeoparquetMetadata,
    setStacGeoparquetItemId,
  } = useStacMap();
  const {
    geojson,
    bbox: valueBbox,
    filled,
  } = useStacValueLayerProperties(value, collections);
  const [bbox, setBbox] = useState<BBox>();
  const small = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (valueBbox) {
      setBbox(valueBbox);
    }
  }, [valueBbox]);

  useEffect(() => {
    if (stacGeoparquetMetadata) {
      setBbox(stacGeoparquetMetadata.bbox);
    }
  }, [stacGeoparquetMetadata]);

  useEffect(() => {
    if (bbox && mapRef.current) {
      const padding = small
        ? {
            top: window.innerHeight / 10 + window.innerHeight / 2,
            bottom: window.innerHeight / 20,
            right: window.innerWidth / 20,
            left: window.innerWidth / 20,
          }
        : {
            top: window.innerHeight / 10,
            bottom: window.innerHeight / 20,
            right: window.innerWidth / 20,
            left: window.innerWidth / 20 + window.innerWidth / 3,
          };
      mapRef.current.fitBounds(sanitizeBbox(bbox), {
        linear: true,
        padding,
      });
    }
  }, [bbox, small]);

  const layers: Layer[] = [
    new GeoJsonLayer({
      id: "picked",
      data: picked as Feature | undefined,
      filled: true,
      stroked: true,
      getFillColor: inverseFillColor,
      getLineColor: inverseLineColor,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
    }),
    new GeoJsonLayer({
      id: "items",
      data: items as Feature[] | undefined,
      filled: true,
      stroked: true,
      getFillColor: fillColor,
      getLineColor: fillColor,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      pickable: true,
      onClick: (info) => {
        setPicked(info.object);
      },
    }),
    new GeoJsonLayer({
      id: "value",
      data: geojson,
      filled: filled && !picked && !items,
      stroked: true,
      getFillColor: fillColor,
      getLineColor: lineColor,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      updateTriggers: [picked, items],
    }),
  ];

  if (stacGeoparquetTable) {
    layers.push(
      new GeoArrowPolygonLayer({
        id: "stac-geoparquet",
        data: stacGeoparquetTable,
        filled: true,
        stroked: true,
        getFillColor: fillColor,
        getLineColor: lineColor,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        autoHighlight: true,
        pickable: true,
        onClick: (info) => {
          setStacGeoparquetItemId(
            stacGeoparquetTable.getChild("id")?.get(info.index),
          );
        },
        updateTriggers: [picked],
      }),
    );
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

function DeckGLOverlay(props: DeckProps) {
  const control = useControl<MapboxOverlay>(() => new MapboxOverlay({}));
  control.setProps(props);
  return <></>;
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

function useStacValueLayerProperties(
  value: StacValue | undefined,
  collections: StacCollection[] | undefined,
) {
  const [geojson, setGeojson] = useState<GeoJSON>();
  const [bbox, setBbox] = useState<BBox>();
  const [filled, setFilled] = useState(false);
  const { geojson: collectionsGeojson, bbox: collectionsBbox } =
    useCollectionsLayerProperties(collections);

  useEffect(() => {
    if (value) {
      switch (value.type) {
        case "Catalog":
          setGeojson(collectionsGeojson);
          setBbox(collectionsBbox);
          setFilled(false);
          break;
        case "Collection":
          setGeojson(
            value.extent?.spatial?.bbox &&
              bboxPolygon(sanitizeBbox(value.extent.spatial.bbox[0])),
          );
          setBbox(value.extent?.spatial?.bbox?.[0] as BBox);
          setFilled(true);
          break;
        case "Feature":
          setGeojson(value as GeoJSON);
          setBbox(value.bbox as BBox | undefined);
          setFilled(true);
          break;
        case "FeatureCollection":
          setGeojson(undefined);
          setBbox(undefined);
          setFilled(false);
          break;
      }
    }
  }, [value, collectionsGeojson, bbox, collectionsBbox]);

  return { geojson, bbox, filled };
}

function useCollectionsLayerProperties(
  collections: StacCollection[] | undefined,
) {
  const [geojson, setGeojson] = useState<FeatureCollection<Polygon>>();
  const [bbox, setBbox] = useState<[number, number, number, number]>();

  useEffect(() => {
    if (collections) {
      const bbox: [number, number, number, number] = [180, 90, -180, -90];
      const polygons = collections
        .map((collection) => {
          if (collection.extent?.spatial?.bbox) {
            const sanitizedBbox = sanitizeBbox(
              collection.extent.spatial.bbox[0],
            );
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
            return bboxPolygon(sanitizedBbox);
          } else {
            return undefined;
          }
        })
        .filter((bbox) => !!bbox);
      if (polygons.length > 0) {
        setGeojson(featureCollection(polygons));
        setBbox(bbox);
      } else {
        setGeojson(undefined);
        setBbox(undefined);
      }
    } else {
      setGeojson(undefined);
      setBbox(undefined);
    }
  }, [collections]);

  return { geojson, bbox };
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
