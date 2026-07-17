"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import {
  LocateFixed,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Store as StoreIcon,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { Button } from "@/components/ui/button";
import StoreInfoDialog from "@/components/toko/store-info-dialog";
import { signout } from "@/lib/logout/action";
import {
  GEOAPIFY_ATTRIBUTION,
  GEOAPIFY_TILE_URL,
  reverseGeocode,
} from "@/lib/geoapify";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/dummy-stores";
import { useTokoList } from "@/lib/toko/hooks";
import type { Toko } from "@/lib/toko/types";

// User location marker icon
const userIcon = L.divIcon({
  className: "",
  html: `<span class="relative flex h-4 w-4">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60"></span>
      <span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow"></span>
    </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Radius feature palette (EEEEEE, 6FCF97, 2FA084, 1F6F5F). 6FCF97 is primary.
const RADIUS_PALETTE = {
  base: "#6FCF97", // circle fill/stroke + active chip
  accent: "#2FA084", // in-radius pin + green text (readable)
  dark: "#1F6F5F", // active chip text
};

// Colored store pin icons (cached per color).
const STORE_COLOR = {
  in: RADIUS_PALETTE.accent,
  out: "#64748b",
  default: "#2563eb",
};
const pinCache: Record<string, L.DivIcon> = {};
function pinIcon(color: string) {
  if (!pinCache[color]) {
    pinCache[color] = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.6" fill="#ffffff" stroke="none"/></svg>`,
      iconSize: [30, 30],
      iconAnchor: [15, 29],
      popupAnchor: [0, -26],
    });
  }
  return pinCache[color];
}

// Great-circle distance between two lat/lng points, in meters (Haversine).
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// Radius presets (meters) for the nearest-radius control.
const RADIUS_OPTIONS = [1000, 2000, 3000, 5000];
const formatRadius = (m: number) => (m < 1000 ? `${m} m` : `${m / 1000} km`);

/** Helper to control the map imperatively from outside the react-leaflet tree. */
function MapController({ onReady }: { onReady: (map: L.Map) => void }) {
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
  const markerRefs = useRef<Record<number, LeafletMarker | null>>({});

  const { data, isLoading } = useTokoList();
  const stores: Toko[] = useMemo(() => data ?? [], [data]);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusM, setRadiusM] = useState(1000);

  // Attach distance-from-user (meters) & in-radius flag to each store.
  const storesWithDistance = useMemo(() => {
    return stores.map((store) => {
      const distance = userLocation
        ? haversineMeters(
            userLocation.lat,
            userLocation.lng,
            Number(store.latitude),
            Number(store.longitude),
          )
        : null;
      return {
        store,
        distance,
        inRadius: distance != null && distance <= radiusM,
      };
    });
  }, [stores, userLocation, radiusM]);

  const inRadiusCount = storesWithDistance.filter((s) => s.inRadius).length;

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

        // Reverse geocode the GPS coordinates -> address via Geoapify.
        try {
          const result = await reverseGeocode(lat, lng);
          setUserLocation({ lat, lng, address: result.formatted });
        } catch (e) {
          setUserLocation({
            lat,
            lng,
            address: "Alamat tidak dapat dimuat.",
          });
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

  const focusStore = useCallback((store: Toko) => {
    mapRef.current?.flyTo(
      [Number(store.latitude), Number(store.longitude)],
      16,
      { duration: 1 },
    );
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

        {/* Nearest-radius circle around the user (green). */}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusM}
            pathOptions={{
              color: RADIUS_PALETTE.base,
              fillColor: RADIUS_PALETTE.base,
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}

        {storesWithDistance.map(({ store, distance, inRadius }) => (
          <Marker
            key={store.id}
            position={[Number(store.latitude), Number(store.longitude)]}
            icon={pinIcon(
              !userLocation
                ? STORE_COLOR.default
                : inRadius
                  ? STORE_COLOR.in
                  : STORE_COLOR.out,
            )}
            ref={(ref) => {
              markerRefs.current[store.id] = ref;
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {store.name}
                </p>
                <p className="text-xs text-foreground">{store.address}</p>
                {(store.price || store.contact) && (
                  <p className="text-xs text-muted-foreground">
                    {store.price ? `Rp ${store.price}` : ""}
                    {store.price && store.contact ? " · " : ""}
                    {store.contact}
                  </p>
                )}
                {distance != null && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: RADIUS_PALETTE.accent }}
                  >
                    {formatDistance(distance)} dari lokasi Anda
                    {inRadius ? " · dalam radius" : ""}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-1000 flex items-start justify-between gap-2 p-4">
        <div className="pointer-events-auto rounded-2xl bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
          <h1 className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="size-4 text-primary" />
            Toko Sekitar
          </h1>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Memuat toko…"
              : userLocation
                ? `${inRadiusCount} dari ${stores.length} toko dalam ${formatRadius(radiusM)}`
                : `${stores.length} toko ditemukan · Lingkup Tani`}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <StoreInfoDialog
            trigger={
              <Button
                className="rounded-full shadow-lg"
                aria-label="Kelola info toko saya"
              >
                <StoreIcon className="size-4" />
                <span className="hidden sm:inline">Toko Saya</span>
              </Button>
            }
          />
          <form action={signout}>
            <Button
              type="submit"
              variant="outline"
              size="icon"
              aria-label="Keluar"
              className="cursor-pointer rounded-full bg-background/90 shadow-lg backdrop-blur"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom overlay: GPS button + banner + store list, stacked vertically */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1000 flex flex-col gap-3 pb-4">
        {/* Locate-me button */}
        <div className="flex justify-end px-4">
          <Button
            size="icon"
            onClick={handleLocate}
            disabled={locating}
            aria-label="Temukan lokasi saya"
            className="pointer-events-auto size-12 rounded-full shadow-lg"
          >
            {locating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <LocateFixed className="size-5" />
            )}
          </Button>
        </div>

        {/* Error / GPS address notification */}
        {(error || userLocation?.address) && (
          <div className="px-4">
            <div
              className={`pointer-events-auto rounded-xl px-4 py-2 text-xs shadow-lg backdrop-blur ${
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

        {/* Nearest-radius control (preset chips) — shown after locating. */}
        {userLocation && (
          <div className="px-4">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur">
              <span className="pl-1.5 text-xs font-medium text-muted-foreground">
                Radius
              </span>
              {RADIUS_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setRadiusM(m)}
                  className="rounded-full px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                  style={
                    radiusM === m
                      ? {
                          backgroundColor: RADIUS_PALETTE.base,
                          color: RADIUS_PALETTE.dark,
                        }
                      : undefined
                  }
                >
                  {formatRadius(m)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Store list (horizontal scroll, mobile-first) */}
        {stores.length > 0 && (
          <div className="pointer-events-auto flex gap-3 overflow-x-auto px-4 pt-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {storesWithDistance.map(({ store, distance, inRadius }) => (
              <button
                key={store.id}
                onClick={() => focusStore(store)}
                className="w-60 shrink-0 rounded-2xl bg-background/95 p-3 text-left shadow-lg backdrop-blur transition active:translate-y-px"
                style={
                  inRadius
                    ? {
                        boxShadow: `0 0 0 2px ${RADIUS_PALETTE.base}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{store.name}</p>
                  {distance != null && (
                    <span
                      className="shrink-0 text-xs font-medium"
                      style={{
                        color: inRadius
                          ? RADIUS_PALETTE.accent
                          : "var(--muted-foreground)",
                      }}
                    >
                      {formatDistance(distance)}
                    </span>
                  )}
                </div>
                {store.price && (
                  <p className="mt-0.5 text-xs text-primary">
                    Rp {store.price}
                  </p>
                )}
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {store.address}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
