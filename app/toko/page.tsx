"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Loader2, LocateFixed, MapPin, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reverseGeocode } from "@/lib/geoapify";

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

export default function TokoPage() {
  const [name, setName] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Set koordinat lalu auto-generate alamat via reverse geocode Geoapify.
  const applyLocation = useCallback(async (p: LatLng) => {
    setCoords(p);
    setSaved(false);
    setError(null);
    setGeocoding(true);
    try {
      const result = await reverseGeocode(p.lat, p.lng);
      setAddress(result.formatted);
    } catch (e) {
      console.error(e);
      setError("Gagal mengambil alamat. Isi manual atau coba lagi.");
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleGPS = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Perangkat ini tidak mendukung GPS / geolokasi.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        applyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
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
  }, [applyLocation]);

  const handleSave = useCallback(() => {
    // TODO: simpan ke Supabase. Sekarang hanya demo (log + tanda tersimpan).
    console.log("Simpan toko:", { name, ...coords, address });
    setSaved(true);
  }, [name, coords, address]);

  const canSave = name.trim() !== "" && coords !== null && address.trim() !== "";

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {/* Peta pemilih lokasi */}
      <div className="relative h-[45dvh] w-full shrink-0">
        <LocationPickerMap value={coords} onChange={applyLocation} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow backdrop-blur">
            <MapPin className="size-3.5 text-primary" />
            Ketuk peta atau geser pin untuk menentukan titik toko
          </div>
        </div>
      </div>

      {/* Form Info Toko */}
      <div className="mx-auto -mt-4 w-full max-w-lg flex-1 rounded-t-3xl bg-background p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-2">
          <Store className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Informasi Toko</h1>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Toko</Label>
            <Input
              id="name"
              placeholder="cth. Toko Tani Makmur"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <Button
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
            {locating ? "Mendeteksi lokasi…" : "Gunakan Lokasi GPS Saya"}
          </Button>

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

          <div className="space-y-1.5">
            <Label htmlFor="address">
              Alamat
              {geocoding && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> memuat…
                </span>
              )}
            </Label>
            <textarea
              id="address"
              rows={3}
              placeholder="Alamat akan terisi otomatis dari titik lokasi, bisa diedit"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSaved(false);
              }}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <p className="text-xs text-muted-foreground">
              Alamat di-generate otomatis dari koordinat (Geoapify), tetap bisa
              kamu perbaiki manual.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="h-11 w-full"
          >
            {saved ? (
              <>
                <Check className="size-4" /> Tersimpan
              </>
            ) : (
              "Simpan Toko"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
