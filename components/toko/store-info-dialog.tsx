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
import StoreForm from "@/components/toko/store-form";
import { useCreateToko, useMyToko, useToko, useUpdateToko } from "@/lib/toko/hooks";
import type { Toko, TokoInput } from "@/lib/toko/types";

// Toko (api response) - TokoInput (form payload).
function toInput(t: Toko): TokoInput {
  return {
    name: t.name,
    latitude: t.latitude,
    longitude: t.longitude,
    address: t.address,
    price: t.price,
    contact: t.contact,
    demand: t.demand,
  };
}

export default function StoreInfoDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Look up the user's store; if it exists - detail/edit mode, otherwise - create.
  const myToko = useMyToko(open);
  const existing = myToko.data?.[0] ?? null;
  const isEdit = existing != null;

  // Fetch the detail by id (fulfils the "get by id" requirement) for edit mode.
  const detail = useToko(open && existing ? existing.id : null);

  const createMut = useCreateToko();
  const updateMut = useUpdateToko(existing?.id ?? -1);

  const submitting = createMut.isPending || updateMut.isPending;
  const mutationError =
    (createMut.error as Error | null)?.message ??
    (updateMut.error as Error | null)?.message ??
    null;

  const loading = myToko.isLoading || (isEdit && detail.isLoading);
  const initial = detail.data ? toInput(detail.data) : undefined;

  const handleSubmit = (input: TokoInput) => {
    const mutation = isEdit ? updateMut : createMut;
    mutation.mutate(input, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="pb-2">
          <DialogTitle>
            <Store className="size-5 text-primary" />
            {isEdit ? "Detail Toko" : "Tambah Toko"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui info toko Anda. Titik lokasi & alamat dari Geoapify."
              : "Tentukan titik lokasi toko; alamat terisi otomatis dari koordinat."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <StoreForm
            key={existing?.id ?? "new"}
            initial={isEdit ? initial : undefined}
            submitLabel={isEdit ? "Simpan Perubahan" : "Tambah Toko"}
            submitting={submitting}
            errorMessage={mutationError}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
