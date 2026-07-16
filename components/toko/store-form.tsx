"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, LocateFixed, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reverseGeocode } from "@/lib/geoapify";
import { EMPTY_DEMAND, type Demand, type TokoInput } from "@/lib/toko/types";

const LocationPickerMap = dynamic(
  () => import("@/components/map/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

type LatLng = { lat: number; lng: number };

const DEMAND_FIELDS: { key: keyof Demand; label: string }[] = [
  { key: "padi", label: "Padi" },
  { key: "jagung", label: "Jagung" },
  { key: "mangga", label: "Mangga" },
];

export type StoreFormProps = {
  /** Initial values (for edit / detail mode). */
  initial?: TokoInput;
  submitLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: TokoInput) => void;
};

export default function StoreForm({
  initial,
  submitLabel = "Save Store",
  submitting = false,
  errorMessage = null,
  onSubmit,
}: StoreFormProps) {
  // Fields that come straight from api/toko (not from Geoapify).
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [demand, setDemand] = useState<Demand>(initial?.demand ?? EMPTY_DEMAND);

  // Fields sourced from Geoapify: lat, lon, address.
  const [coords, setCoords] = useState<LatLng | null>(
    initial?.latitude && initial?.longitude
      ? { lat: Number(initial.latitude), lng: Number(initial.longitude) }
      : null,
  );
  const [address, setAddress] = useState(initial?.address ?? "");

  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Set the coordinates, then auto-generate the address via Geoapify reverse geocode.
  const applyLocation = useCallback(async (p: LatLng) => {
    setCoords(p);
    setGeoError(null);
    setGeocoding(true);
    try {
      const result = await reverseGeocode(p.lat, p.lng);
      setAddress(result.formatted);
    } catch (e) {
      console.error(e);
      setGeoError("Failed to fetch address. Enter it manually or try again.");
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleGPS = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("This device does not support GPS / geolocation.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        applyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable GPS and allow location access."
            : "Failed to get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }, [applyLocation]);

  const canSubmit =
    name.trim() !== "" && coords !== null && address.trim() !== "" && !submitting;

  const handleSubmit = useCallback(() => {
    if (!coords) return;
    const input: TokoInput = {
      name: name.trim(),
      // Geoapify values are sent as strings to match the api/toko schema.
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      address: address.trim(),
      // Remaining fields come purely from the form.
      price: price.trim(),
      contact: contact.trim(),
      demand,
    };
    onSubmit(input);
  }, [name, coords, address, price, contact, demand, onSubmit]);

  return (
    <div className="flex flex-col">
      {/* Location picker map (Geoapify) */}
      <div className="relative mx-5 h-48 shrink-0 overflow-hidden rounded-xl border">
        <LocationPickerMap value={coords} onChange={applyLocation} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-2">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium shadow backdrop-blur">
            <MapPin className="size-3 text-primary" />
            Tap the map or drag the pin
          </span>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto p-5 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Store Name</Label>
          <Input
            id="name"
            placeholder="e.g. Toko Tani Makmur"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGPS}
          disabled={locating}
          className="h-11 w-full"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          {locating ? "Detecting location…" : "Use My GPS Location"}
        </Button>

        {/* Lat / Lon from Geoapify */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              inputMode="decimal"
              placeholder="-6.1754"
              value={coords?.lat ?? ""}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!Number.isNaN(lat)) {
                  applyLocation({ lat, lng: coords?.lng ?? 0 });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              inputMode="decimal"
              placeholder="106.8272"
              value={coords?.lng ?? ""}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!Number.isNaN(lng)) {
                  applyLocation({ lat: coords?.lat ?? 0, lng });
                }
              }}
            />
          </div>
        </div>

        {/* Address from Geoapify */}
        <div className="space-y-1.5">
          <Label htmlFor="address">
            Address
            {geocoding && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> loading…
              </span>
            )}
          </Label>
          <textarea
            id="address"
            rows={2}
            placeholder="Address is auto-filled from the location point, editable"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>

        {/* Remaining fields come purely from api/toko */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (Rp)</Label>
            <Input
              id="price"
              inputMode="numeric"
              placeholder="50000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact</Label>
            <Input
              id="contact"
              inputMode="tel"
              placeholder="08123456789"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Demand</Label>
          <div className="grid grid-cols-3 gap-3">
            {DEMAND_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={demand[f.key]}
                  onChange={(e) =>
                    setDemand((d) => ({
                      ...d,
                      [f.key]: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {(errorMessage || geoError) && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage ?? geoError}
          </p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-11 w-full"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
