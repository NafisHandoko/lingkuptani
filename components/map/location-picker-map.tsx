"use client";

import { useMemo, useRef } from "react";
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

/** Klik di peta => pindahkan titik toko ke posisi itu. */
function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Geser peta mengikuti titik saat berubah dari luar (mis. tombol GPS). */
function RecenterOnChange({ value }: { value: LatLng | null }) {
  const map = useMap();
  const last = useRef<string>("");
  if (value) {
    const key = `${value.lat},${value.lng}`;
    if (key !== last.current) {
      last.current = key;
      map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 16), {
        duration: 1,
      });
    }
  }
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
