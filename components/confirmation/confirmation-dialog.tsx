"use client";

import { useState } from "react";
import { Bell, Loader2, Store } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import ConfirmationForm from "@/components/confirmation/confirmation-form";
import { useCreateTransaksi, useMyTransaksi, useTransaksi, useUpdateTransaksi } from "@/lib/transaksi/hooks";
import type { Transaksi, TransaksiInput } from "@/lib/transaksi/types";

// Transaksi (api response) - TransaksiInput (form payload).
function toInput(t: Transaksi): TransaksiInput {
  return {
    demand: t.demand,
  };
}

export default function ConfirmationDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Look up the user's store; if it exists - detail/edit mode, otherwise - create.
  const myTransaksi = useMyTransaksi(open);
  const existing = myTransaksi.data?.[0] ?? null;
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

  const loading = myTransaksi.isLoading || (isEdit && detail.isLoading);
  const initial = detail.data ? toInput(detail.data) : undefined;

  const handleSubmit = (input: TransaksiInput) => {
    const mutation = isEdit ? updateMut : createMut;
    mutation.mutate(input, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="pb-2">
          <DialogTitle>
            <Bell className="size-5 text-primary" />
            Konfirmasi
          </DialogTitle>
          <DialogDescription>
              Confirm receipt and delivery of items.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <p> Hai </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
