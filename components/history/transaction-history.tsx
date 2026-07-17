"use client";

import { useState } from "react";
import {
  History,
  Loader2,
  ShoppingCart,
  TrendingUp,
  Package,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMyToko, useToko } from "@/lib/toko/hooks";
import { useMyTransaksi, useTransaksiByTokoId } from "@/lib/transaksi/hooks";
import type { Transaksi } from "@/lib/transaksi/types";
import { useUsers } from "@/lib/users/hooks";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DemandList({ items }: { items: Transaksi["demand"] }) {
  return (
    <div className="mt-2 space-y-1">
      {items.map((item, i) => (
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
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
        style={{ background: "#dff0e8" }}
      >
        <History className="size-7" style={{ color: "#6FCF97" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "#1F6F5F" }}>
        Belum ada transaksi
      </p>
      <p className="text-xs mt-1" style={{ color: "#85b5a5" }}>
        {label}
      </p>
    </div>
  );
}

// ─── Penjualan row: resolve buyer toko name via useToko hook ─────────────────

function PenjualanRow({ tx }: { tx: Transaksi }) {
  const toko = useToko(tx.buyer);
  const tokoName = toko.data?.name ?? (toko.isLoading ? "Memuat…" : `Toko #${tx.buyer}`);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#fff",
        border: "1px solid rgba(111,207,151,0.25)",
        boxShadow: "0 1px 6px rgba(31,111,95,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
            style={{ background: "#dff0e8" }}
          >
            <TrendingUp className="size-4" style={{ color: "#2FA084" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1F6F5F" }}>
              {tokoName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#85b5a5" }}>
              {formatDate(tx.created_at)}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "#dff0e8", color: "#1F6F5F" }}
        >
          Diterima
        </span>
      </div>
      <DemandList items={tx.demand} />
    </div>
  );
}

// ─── Penjualan Tab ────────────────────────────────────────────────────────────

function PenjualanTab({ enabled }: { enabled: boolean }) {
  const query = useMyTransaksi(enabled);

  if (query.isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin" style={{ color: "#6FCF97" }} />
    </div>
  );

  if (query.isError) return (
    <div
      className="mx-5 px-4 py-3 rounded-xl text-sm"
      style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}
    >
      {(query.error as Error).message}
    </div>
  );

  const accepted = (query.data ?? [])
    .filter((t) => t.status === "accepted")
    .slice()
    .reverse(); // newest first

  if (accepted.length === 0)
    return <EmptyState label="Transaksi penjualan yang berhasil akan muncul di sini" />;

  return (
    <div className="space-y-3 px-5 pb-5">
      {accepted.map((tx) => (
        <PenjualanRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}

// ─── Pembelian row: resolve seller user display name ─────────────────────────
// We use a static lookup map built once when the tab data arrives.

function PembelianRow({
  tx,
  sellerLabel,
}: {
  tx: Transaksi;
  sellerLabel: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#fff",
        border: "1px solid rgba(111,207,151,0.25)",
        boxShadow: "0 1px 6px rgba(31,111,95,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
            style={{ background: "#e8f5ef" }}
          >
            <ShoppingCart className="size-4" style={{ color: "#2FA084" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1F6F5F" }}>
              {sellerLabel}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#85b5a5" }}>
              {formatDate(tx.created_at)}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "#dff0e8", color: "#1F6F5F" }}
        >
          Diterima
        </span>
      </div>
      <DemandList items={tx.demand} />
    </div>
  );
}

// ─── Pembelian Tab ────────────────────────────────────────────────────────────

function PembelianTab({ enabled }: { enabled: boolean }) {
  // Step 1: get user's own toko
  const myTokoQuery = useMyToko(enabled);
  const tokoId = myTokoQuery.data?.[0]?.id ?? null;

  // Step 2: fetch transactions for that toko
  const txQuery = useTransaksiByTokoId(tokoId, enabled && tokoId != null);

  // Step 3: fetch all users to resolve seller name/email
  const usersQuery = useUsers(enabled);

  const loading = myTokoQuery.isLoading || txQuery.isLoading || usersQuery.isLoading;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin" style={{ color: "#6FCF97" }} />
    </div>
  );

  if (txQuery.isError) return (
    <div
      className="mx-5 px-4 py-3 rounded-xl text-sm"
      style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}
    >
      {(txQuery.error as Error).message}
    </div>
  );

  if (!tokoId) return (
    <EmptyState label="Tambahkan toko Anda untuk melihat riwayat pembelian" />
  );

  // Build a quick id → display-name map
  const userMap = new Map(
    (usersQuery.data ?? []).map((u) => [u.id, u.name ?? u.email])
  );

  const accepted = (txQuery.data ?? [])
    .filter((t) => t.status === "accepted")
    .slice()
    .reverse(); // newest first

  if (accepted.length === 0)
    return <EmptyState label="Transaksi pembelian toko Anda yang berhasil akan muncul di sini" />;

  return (
    <div className="space-y-3 px-5 pb-5">
      {accepted.map((tx) => (
        <PembelianRow
          key={tx.id}
          tx={tx}
          sellerLabel={userMap.get(tx.seller) ?? `Pengguna ${tx.seller.slice(0, 8)}…`}
        />
      ))}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

type Tab = "penjualan" | "pembelian";

export default function TransactionHistoryDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("penjualan");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>
            <History className="size-5 text-primary" />
            Riwayat Transaksi
          </DialogTitle>
          <DialogDescription>
            Hanya transaksi dengan status{" "}
            <strong>diterima</strong> yang ditampilkan.
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div
          className="mx-5 mt-4 mb-3 flex rounded-xl p-1 gap-1"
          style={{ background: "#dff0e8" }}
        >
          {(["penjualan", "pembelian"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-150"
              style={
                tab === t
                  ? {
                      background: "#fff",
                      color: "#1F6F5F",
                      boxShadow: "0 1px 4px rgba(31,111,95,0.12)",
                    }
                  : { color: "#5a7a6e" }
              }
            >
              {t === "penjualan" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <ShoppingCart className="size-3.5" />
              )}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto max-h-[60dvh]">
          {tab === "penjualan" ? (
            <PenjualanTab enabled={open} />
          ) : (
            <PembelianTab enabled={open} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
