"use client";

import { useCallback, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_DEMAND, type Demand, type DemandItem } from "@/lib/toko/types";
import { TransaksiInput } from "@/lib/transaksi/types";

export type SellFormProps = {
  /** Initial values (for edit / detail mode). */
  initial?: TransaksiInput;
  commodityOptions: DemandItem[];
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

function createDemandItem(): DemandItem {
  return { commodity: "", price: 0, demand: 0 };
}

function getAvailableCommodityOptions(
  options: DemandItem[],
  demand: Demand,
  currentIndex: number,
): DemandItem[] {
  const selectedElsewhere = new Set(
    demand
      .filter((_, index) => index !== currentIndex)
      .map((item) => item.commodity),
  );

  return options.filter(
    (option) =>
      option.commodity === demand[currentIndex]?.commodity ||
      !selectedElsewhere.has(option.commodity),
  );
}

function getSelectedCommodityOption(
  options: DemandItem[],
  commodity: string,
): DemandItem | undefined {
  return options.find((option) => option.commodity === commodity);
}

export default function SellForm({
  initial,
  commodityOptions,
  submitLabel = "Jual",
  submitting = false,
  errorMessage = null,
  onSubmit,
}: SellFormProps) {
  const [demand, setDemand] = useState<Demand>(normalizeDemand(initial?.demand));

  const handleSubmit = useCallback(() => {
    if (demand.length === 0) return;
    const input: TransaksiInput = {
      demand,
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
              onClick={() => setDemand((current) => [...current, createDemandItem()])}
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
                  <select
                    id={`commodity-${index}`}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    value={item.commodity}
                    onChange={(e) =>
                      setDemand((current) => updateDemandItem(current, index, { commodity: e.target.value }))
                    }
                  >
                    <option value="">Select commodity</option>
                    {getAvailableCommodityOptions(commodityOptions, demand, index).map((option) => (
                      <option key={option.commodity} value={option.commodity}>
                        {option.commodity} ({option.demand} kg)
                      </option>
                    ))}
                  </select>
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
                    {(() => {
                      const selectedCommodity = getSelectedCommodityOption(
                        commodityOptions,
                        item.commodity,
                      );
                      const maxDemand = selectedCommodity?.demand;

                      return (
                    <Input
                      id={`demand-${index}`}
                      inputMode="numeric"
                      placeholder="100"
                      max={maxDemand}
                      value={item.demand}
                      onChange={(e) =>
                        setDemand((current) => {
                          const nextValue = Number(e.target.value) || 0;
                          return updateDemandItem(current, index, {
                            demand:
                              typeof maxDemand === "number"
                                ? Math.min(nextValue, maxDemand)
                                : nextValue,
                          });
                        })
                      }
                    />
                      );
                    })()}
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
