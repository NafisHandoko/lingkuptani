"use client";

import { useState } from "react";
import { Loader2, Store } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateToko } from "@/lib/toko/api";
import { tokoKeys } from "@/lib/toko/hooks";
import type { Demand, Toko, TokoInput } from "@/lib/toko/types";
import { createTransaksi } from "@/lib/transaksi/api";
import { transaksiKeys } from "@/lib/transaksi/hooks";
import type { TransaksiInput } from "@/lib/transaksi/types";
import SellForm from "./sell-form";

function subtractDemand(storeDemand: Demand, soldDemand: Demand): Demand {
  return storeDemand
    .map((storeItem) => {
      const soldItem = soldDemand.find((item) => item.commodity === storeItem.commodity);
      const soldAmount = soldItem?.demand ?? 0;

      return {
        ...storeItem,
        demand: Math.max(storeItem.demand - soldAmount, 0),
      };
    })
    .filter((item) => item.demand > 0);
}

function toTokoInput(toko: Toko, demand: Demand): TokoInput {
  return {
    name: toko.name,
    longitude: toko.longitude,
    latitude: toko.latitude,
    demand,
    price: toko.price,
    contact: toko.contact,
    address: toko.address,
  };
}

export default function SellInfoDialog({
  trigger,
  toko,
}: {
  trigger: React.ReactNode;
  toko: Toko;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const commodityOptions = toko.demand.filter((item) => item.demand > 0);

  const sellMutation = useMutation({
    mutationFn: async (input: TransaksiInput) => {
      const createdTransaction = await createTransaksi({
        ...input,
        toko_id: toko.id,
      });

      const remainingDemand = subtractDemand(toko.demand, input.demand);
      await updateToko(toko.id, toTokoInput(toko, remainingDemand));

      return createdTransaction;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transaksiKeys.all }),
        queryClient.invalidateQueries({ queryKey: tokoKeys.all }),
      ]);
      setOpen(false);
    },
  });

  const mutationError = (sellMutation.error as Error | null)?.message ?? null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="pb-2">
          <DialogTitle>
            <Store className="size-5 text-primary" />
            Buat transaksi
          </DialogTitle>
          <DialogDescription>
            Buat penjualan di sini.
          </DialogDescription>
        </DialogHeader>

        {sellMutation.isPending ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SellForm
            key={toko.id}
            commodityOptions={commodityOptions}
            submitLabel="Buat transaksi"
            submitting={sellMutation.isPending}
            errorMessage={mutationError}
            onSubmit={(input) => sellMutation.mutate(input)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
