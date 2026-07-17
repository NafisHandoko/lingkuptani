"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { GEOAPIFY_ATTRIBUTION, GEOAPIFY_TILE_URL } from "@/lib/geoapify";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/dummy-stores";

type LatLng = { lat: number; lng: number };


// When the map renders inside a dialog/modal, the container size starts at 0
// so tiles show up gray. Recalculate the size after the open animation
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Click on the map => move the store point to that position
function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Pan the map to follow the point when it changes externally (e.g. GPS button)
function RecenterOnChange({ value }: { value: LatLng | null }) {
  const map = useMap();
  const lat = value?.lat;
  const lng = value?.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 1 });
  }, [map, lat, lng]);
  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const center = value ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };

  const dragHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (!m) return;
        const { lat, lng } = m.getLatLng();
        onChange({ lat, lng });
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={value ? 16 : DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer url={GEOAPIFY_TILE_URL} attribution={GEOAPIFY_ATTRIBUTION} />
      <InvalidateSizeOnMount />
      <ClickToPlace onPick={onChange} />
      <RecenterOnChange value={value} />
      {value && (
        <Marker
          draggable
          position={[value.lat, value.lng]}
          ref={(ref) => {
            markerRef.current = ref;
          }}
          eventHandlers={dragHandlers}
        />
      )}
    </MapContainer>
  );
}
