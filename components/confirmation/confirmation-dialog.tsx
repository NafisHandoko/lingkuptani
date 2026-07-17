"use client";

import { useState } from "react";
import { Bell, Check, X, Loader2, Package, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMyToko } from "@/lib/toko/hooks";
import { useTransaksiByTokoId, useUpdateTransaksiStatus } from "@/lib/transaksi/hooks";
import type { Transaksi } from "@/lib/transaksi/types";

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Single pending transaction card ─────────────────────────────────────────

function PendingCard({ tx }: { tx: Transaksi }) {
  const updateStatus = useUpdateTransaksiStatus();
  const isPending = updateStatus.isPending;

  function handle(status: "accepted" | "rejected") {
    updateStatus.mutate({ id: tx.id, update: { status } });
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#fff",
        border: "1px solid rgba(111,207,151,0.25)",
        boxShadow: "0 1px 6px rgba(31,111,95,0.06)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs" style={{ color: "#85b5a5" }}>
            {formatDate(tx.created_at)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#5a7a6e" }}>
            Penjual: <span className="font-mono">{tx.seller.slice(0, 8)}…</span>
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "#fef9c3", color: "#854d0e" }}
        >
          Menunggu
        </span>
      </div>

      {/* Demand list */}
      <div className="space-y-1 mb-3">
        {tx.demand.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1" style={{ color: "#5a7a6e" }}>
              <Package className="size-3 shrink-0" />
              {item.commodity}
            </span>
            <span className="font-medium" style={{ color: "#1F6F5F" }}>
              {item.demand} kg · Rp {Number(item.price).toLocaleString("id-ID")}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handle("accepted")}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-white transition-all duration-150 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #6FCF97 0%, #2FA084 100%)",
            boxShadow: "0 2px 8px rgba(111,207,151,0.35)",
          }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.background = "linear-gradient(135deg, #2FA084 0%, #1F6F5F 100%)";
          }}
          onMouseLeave={(e) => {
            if (!isPending) e.currentTarget.style.background = "linear-gradient(135deg, #6FCF97 0%, #2FA084 100%)";
          }}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Terima
        </button>

        <button
          onClick={() => handle("rejected")}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-50"
          style={{
            background: "rgba(220,38,38,0.07)",
            border: "1px solid rgba(220,38,38,0.2)",
            color: "#dc2626",
          }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.background = "rgba(220,38,38,0.14)";
          }}
          onMouseLeave={(e) => {
            if (!isPending) e.currentTarget.style.background = "rgba(220,38,38,0.07)";
          }}
        >
          <X className="size-3.5" />
          Tolak
        </button>
      </div>

      {/* Mutation error */}
      {updateStatus.isError && (
        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "#dc2626" }}>
          <AlertCircle className="size-3" />
          {(updateStatus.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function ConfirmationDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Step 1: find the user's own toko
  const myTokoQuery = useMyToko(open);
  const tokoId = myTokoQuery.data?.[0]?.id ?? null;

  // Step 2: fetch transactions for that toko (only when tokoId is known)
  const txQuery = useTransaksiByTokoId(tokoId, open && tokoId != null);

  const loading = myTokoQuery.isLoading || txQuery.isLoading;
  const pendingTxs = (txQuery.data ?? []).filter((t) => t.status === "pending");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>
            <Bell className="size-5 text-primary" />
            Konfirmasi Transaksi
          </DialogTitle>
          <DialogDescription>
            Terima atau tolak permintaan pembelian yang masuk ke toko Anda.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[65dvh] px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin" style={{ color: "#6FCF97" }} />
            </div>
          ) : !tokoId ? (
            /* User has no toko */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                style={{ background: "#dff0e8" }}
              >
                <Bell className="size-7" style={{ color: "#6FCF97" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#1F6F5F" }}>
                Belum ada toko
              </p>
              <p className="text-xs mt-1" style={{ color: "#85b5a5" }}>
                Tambahkan toko Anda terlebih dahulu untuk menerima pesanan
              </p>
            </div>
          ) : pendingTxs.length === 0 ? (
            /* No pending transactions */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                style={{ background: "#dff0e8" }}
              >
                <Bell className="size-7" style={{ color: "#6FCF97" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#1F6F5F" }}>
                Tidak ada permintaan masuk
              </p>
              <p className="text-xs mt-1" style={{ color: "#85b5a5" }}>
                Permintaan pembelian yang menunggu konfirmasi akan muncul di sini
              </p>
            </div>
          ) : (
            /* Pending transaction cards */
            <div className="space-y-3">
              {pendingTxs.map((tx) => (
                <PendingCard key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
