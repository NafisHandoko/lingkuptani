"use client";

import { useCallback, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import { LocateFixed, Loader2, MapPin, Navigation } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { Button } from "@/components/ui/button";
import {
  GEOAPIFY_ATTRIBUTION,
  GEOAPIFY_TILE_URL,
  reverseGeocode,
} from "@/lib/geoapify";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DUMMY_STORES,
  type Store,
} from "@/lib/dummy-stores";

/** Ikon titik lokasi user (dot biru berdenyut). */
const userIcon = L.divIcon({
  className: "",
  html: `<span class="relative flex h-4 w-4">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60"></span>
      <span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow"></span>
    </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Helper untuk menggeser peta secara imperatif dari luar tree react-leaflet. */
function MapController({
  onReady,
}: {
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();
  onReady(map);
  return null;
}

type UserLocation = {
  lat: number;
  lng: number;
  address: string | null;
};

export default function StoreMap() {
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Perangkat ini tidak mendukung GPS / geolokasi.");
      return;
    }
    setError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng, address: null });
        mapRef.current?.flyTo([lat, lng], 16, { duration: 1.2 });

        // Reverse geocode koordinat GPS -> alamat lewat Geoapify.
        try {
          const result = await reverseGeocode(lat, lng);
          setUserLocation({ lat, lng, address: result.formatted });
        } catch (e) {
          setUserLocation({ lat, lng, address: "Alamat tidak dapat dimuat." });
          console.error(e);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan GPS lalu izinkan akses lokasi."
            : "Gagal mendapatkan lokasi. Coba lagi.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }, []);

  const focusStore = useCallback((store: Store) => {
    mapRef.current?.flyTo([store.lat, store.lng], 16, { duration: 1 });
    markerRefs.current[store.id]?.openPopup();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapController
          onReady={(map) => {
            mapRef.current = map;
          }}
        />
        <TileLayer url={GEOAPIFY_TILE_URL} attribution={GEOAPIFY_ATTRIBUTION} />

        {DUMMY_STORES.map((store) => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            ref={(ref) => {
              markerRefs.current[store.id] = ref;
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {store.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {store.category}
                </p>
                <p className="text-xs text-foreground">{store.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Lokasi Anda
                </p>
                <p className="text-xs text-muted-foreground">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
                {userLocation.address && (
                  <p className="text-xs text-foreground">
                    {userLocation.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-4">
        <div className="pointer-events-auto rounded-2xl bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
          <h1 className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="size-4 text-primary" />
            Toko Sekitar
          </h1>
          <p className="text-xs text-muted-foreground">
            {DUMMY_STORES.length} toko ditemukan · Lingkup Tani
          </p>
        </div>
      </div>

      {/* Tombol lokasi saya */}
      <div className="absolute bottom-44 right-4 z-[1000]">
        <Button
          size="icon"
          onClick={handleLocate}
          disabled={locating}
          aria-label="Temukan lokasi saya"
          className="size-12 rounded-full shadow-lg"
        >
          {locating ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <LocateFixed className="size-5" />
          )}
        </Button>
      </div>

      {/* Notifikasi error / alamat GPS */}
      {(error || userLocation?.address) && (
        <div className="absolute inset-x-0 bottom-40 z-[1000] px-4">
          <div
            className={`rounded-xl px-4 py-2 text-xs shadow-lg backdrop-blur ${
              error
                ? "bg-destructive/10 text-destructive"
                : "bg-background/90 text-foreground"
            }`}
          >
            {error ? (
              error
            ) : (
              <span className="flex items-start gap-2">
                <Navigation className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                <span>
                  <b>Lokasi Anda:</b> {userLocation?.address}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Daftar toko (scroll horizontal, mobile-first) */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] pb-4">
        <div className="flex gap-3 overflow-x-auto px-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DUMMY_STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => focusStore(store)}
              className="w-60 shrink-0 rounded-2xl bg-background/95 p-3 text-left shadow-lg backdrop-blur transition active:translate-y-px"
            >
              <p className="truncate text-sm font-semibold">{store.name}</p>
              <p className="mt-0.5 text-xs text-primary">{store.category}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {store.address}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
