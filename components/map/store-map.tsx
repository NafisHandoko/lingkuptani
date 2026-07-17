"use client";

import { useCallback, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import {
  LocateFixed,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Store as StoreIcon,
  Bell,
  History,
  DollarSign,
  Banknote
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
import ConfirmationDialog from "../confirmation/confirmation-dialog";
import { Card, CardContent, CardTitle } from "../ui/card";
import TransactionHistoryDialog from "../history/transaction-history";
import SellInfoDialog from "../sell/sell-info-dialog";

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
  const stores: Toko[] = data ?? [];

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("This device does not support GPS / geolocation.");
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
            address: "Address could not be loaded.",
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
            ? "Location permission denied. Enable GPS and allow location access."
            : "Failed to get your location. Please try again.",
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

        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[Number(store.latitude), Number(store.longitude)]}
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
                {(store.demand.length > 0 || store.contact) && (
                  <p className="text-xs text-foreground">
                    Kontak: {store.contact}
                  </p>
                )}
                <Card className="rounded-lg border bg-background/90 shadow-lg backdrop-blur">
                  <CardContent className="space-y-2 p-3 py-0">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Kebutuhan
                    </CardTitle>
                    {store.demand.length > 0 ? (
                      <div className="space-y-1">
                        {store.demand.map((demand, index) => (
                          <p
                            key={`${demand.commodity}-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            {demand.commodity}: {demand.demand} kg @ Rp {demand.price} / kg
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Kebutuhan terpenuhi</p>
                    )}
					<SellInfoDialog
						trigger={
						<Button
							className="rounded-full shadow-lg w-full"
							aria-label="Jual ke sini"
						>
							<Banknote className="size-4" />
							<span className="hidden sm:inline">Jual ke sini</span>
						</Button>
						}
					/>
                  </CardContent>
                </Card>
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
                  Your Location
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
            Nearby Stores
          </h1>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading stores…"
              : `${stores.length} stores found · Lingkup Tani`}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <StoreInfoDialog
            trigger={
              <Button
                className="rounded-full shadow-lg"
                aria-label="Manage my store info"
              >
                <StoreIcon className="size-4" />
                <span className="hidden sm:inline">My Store</span>
              </Button>
            }
          />
		  <ConfirmationDialog
            trigger={
              <Button
                className="rounded-full shadow-lg"
                aria-label="Confirm transaction"
              >
                <Bell className="size-4" />
                {/* <span className="hidden sm:inline">Confirmations</span> */}
              </Button>
            }
          />
		  <TransactionHistoryDialog
            trigger={
              <Button
                className="rounded-full shadow-lg"
                aria-label="View transaction history"
              >
                <History className="size-4" />
                {/* <span className="hidden sm:inline">Confirmations</span> */}
              </Button>
            }
          />
          <form action={signout}>
            <Button
              type="submit"
              variant="outline"
              size="icon"
              aria-label="Log out"
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
            aria-label="Find my location"
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
                    <b>Your location:</b> {userLocation?.address}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Store list (horizontal scroll, mobile-first) */}
        {stores.length > 0 && (
          <div className="pointer-events-auto flex gap-3 overflow-x-auto px-4 pt-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => focusStore(store)}
                className="w-60 shrink-0 rounded-2xl bg-background/95 p-3 text-left shadow-lg backdrop-blur transition active:translate-y-px"
              >
                <p className="truncate text-sm font-semibold">{store.name}</p>
                {store.demand.length > 0 && (
                  <p className="mt-0.5 text-xs text-primary">
                    {store.demand.length} demands
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
