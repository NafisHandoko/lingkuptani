"use client";

import { useState } from "react";
import { Loader2, Store } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateTransaksi, useMyTransaksi, useTransaksi, useUpdateTransaksi } from "@/lib/transaksi/hooks";
import SellForm from "./sell-form";
import { Transaksi, TransaksiInput } from "@/lib/transaksi/types";

// Toko (api response) - TokoInput (form payload).
function toInput(t: Transaksi): TransaksiInput {
  return {
    demand: t.demand,
	verified: t.verified
  };
}

export default function SellInfoDialog({
  trigger,
  tokoId,
}: {
  trigger: React.ReactNode;
  tokoId: number;
}) {
  const [open, setOpen] = useState(false);

  // Look up the user's store; if it exists - detail/edit mode, otherwise - create.
  const myToko = useMyTransaksi(open);
  const existing = (myToko.data as Transaksi[] | undefined)?.[0] ?? null;
  const isEdit = existing != null;

  // Fetch the detail by id (fulfils the "get by id" requirement) for edit mode.
  const detail = useTransaksi(open && existing ? existing.id : null);

  const createMut = useCreateTransaksi();
  const updateMut = useUpdateTransaksi(existing?.id ?? -1);

  const submitting = createMut.isPending || updateMut.isPending;
  const mutationError =
    (createMut.error as Error | null)?.message ??
    (updateMut.error as Error | null)?.message ??
    null;

  const loading = myToko.isLoading || (isEdit && detail.isLoading);

  const handleSubmit = (input: TransaksiInput) => {
    const mutation = isEdit ? updateMut : createMut;
    mutation.mutate({ ...input, toko_id: tokoId }, { onSuccess: () => setOpen(false) });
  };

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

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SellForm
            key={existing?.id ?? "new"}
            submitLabel={isEdit ? "Save Changes" : "Add Store"}
            submitting={submitting}
            errorMessage={mutationError}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
