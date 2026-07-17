"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, LocateFixed, MapPin, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reverseGeocode } from "@/lib/geoapify";
import { EMPTY_DEMAND, type Demand, type DemandItem, type TokoInput } from "@/lib/toko/types";
import { TransaksiInput } from "@/lib/transaksi/types";

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

export type SellFormProps = {
  /** Initial values (for edit / detail mode). */
  initial?: TransaksiInput;
  submitLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: TransaksiInput) => void;
};

function normalizeDemand(input?: Demand): Demand {
  if (input?.length) return input;
  return EMPTY_DEMAND;
}

function updateDemandItem(
  items: Demand,
  index: number,
  patch: Partial<DemandItem>,
): Demand {
  return items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, ...patch } : item,
  );
}

export default function SellForm({
  initial,
  submitLabel = "Jual",
  submitting = false,
  errorMessage = null,
  onSubmit,
}: SellFormProps) {
  const [demand, setDemand] = useState<Demand>(normalizeDemand(initial?.demand));

  const handleSubmit = useCallback(() => {
    if (demand.length === 0) return;

    const firstPrice = demand[0]?.price ?? 0;
    const input: TransaksiInput = {
      demand,
	  verified: initial?.verified ?? false,
    };
    onSubmit(input);
  }, [demand, onSubmit]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="space-y-4 overflow-y-auto p-5 pt-4">
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Demand</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDemand((current) => [
                  ...current,
                  { commodity: "", price: 0, demand: 0 },
                ])
              }
              className="h-8"
            >
              <Plus className="size-4" />
              Add commodity
            </Button>
          </div>

          <div className="space-y-3">
            {demand.map((item, index) => (
              <div key={`${item.commodity || "commodity"}-${index}`} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Commodity {index + 1}
                  </span>
                  {demand.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setDemand((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`commodity-${index}`} className="text-xs text-muted-foreground">
                    Commodity
                  </Label>
                  <Input
                    id={`commodity-${index}`}
                    placeholder="Padi"
                    value={item.commodity}
                    onChange={(e) =>
                      setDemand((current) => updateDemandItem(current, index, { commodity: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`price-${index}`} className="text-xs text-muted-foreground">
                      Price (Rp)
                    </Label>
                    <Input
                      id={`price-${index}`}
                      inputMode="numeric"
                      placeholder="50000"
                      value={item.price}
                      onChange={(e) =>
                        setDemand((current) =>
                          updateDemandItem(current, index, { price: Number(e.target.value) || 0 }),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`demand-${index}`} className="text-xs text-muted-foreground">
                      Demand
                    </Label>
                    <Input
                      id={`demand-${index}`}
                      inputMode="numeric"
                      placeholder="100"
                      value={item.demand}
                      onChange={(e) =>
                        setDemand((current) =>
                          updateDemandItem(current, index, { demand: Number(e.target.value) || 0 }),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(errorMessage) && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="p-5">
        <Button
          type="button"
          onClick={handleSubmit}
          className="h-11 w-full"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
