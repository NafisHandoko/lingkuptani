"use client";

import { useState, useEffect } from "react";
import { History, Loader2, ShoppingCart, TrendingUp, Package, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type DemandItem = {
  commodity: string;
  demand: number;
  price: string | number;
};

type Transaction = {
  id: number;
  seller: string;   // user id (UUID)
  buyer: number;    // toko id
  demand: DemandItem[];
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type TokoDetail = {
  id: number;
  name: string;
};

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
};

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

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat: ${url}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DemandList({ items }: { items: DemandItem[] }) {
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

// ─── Penjualan Tab ────────────────────────────────────────────────────────────
// Hits GET /api/transaction?mine=true  (seller = current user)
// For each accepted tx, resolves buyer toko name via GET /api/toko/:id

function PenjualanTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ tx: Transaction; tokoName: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const all = await fetchJSON<Transaction[]>("/api/transaction?mine=true");
        const accepted = all.filter((t) => t.status === "accepted");

        // Resolve toko names in parallel, with per-item fallback
        const resolved = await Promise.all(
          accepted.map(async (tx) => {
            try {
              const toko = await fetchJSON<TokoDetail>(`/api/toko/${tx.buyer}`);
              return { tx, tokoName: toko.name };
            } catch {
              return { tx, tokoName: `Toko #${tx.buyer}` };
            }
          })
        );

        if (!cancelled) setItems(resolved.reverse()); // newest first
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin" style={{ color: "#6FCF97" }} />
    </div>
  );

  if (error) return (
    <div className="px-5 py-4 text-sm rounded-xl mx-5" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
      {error}
    </div>
  );

  if (items.length === 0) return (
    <EmptyState label="Transaksi penjualan yang berhasil akan muncul di sini" />
  );

  return (
    <div className="space-y-3 px-5 pb-5">
      {items.map(({ tx, tokoName }) => (
        <div
          key={tx.id}
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
      ))}
    </div>
  );
}

// ─── Pembelian Tab ────────────────────────────────────────────────────────────
// Needs the user's own toko id first (GET /api/toko?mine=true)
// Then hits GET /api/transaction?toko_id=:id  (buyer = user's toko)
// For each accepted tx, resolves seller user via GET /api/users

function PembelianTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ tx: Transaction; sellerLabel: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1 – find the logged-in user's own toko
        const myToko = await fetchJSON<{ id: number }[]>("/api/toko?mine=true");
        if (!myToko.length) {
          if (!cancelled) { setItems([]); setLoading(false); }
          return;
        }
        const tokoId = myToko[0].id;

        // Step 2 – fetch transactions for this toko
        const all = await fetchJSON<Transaction[]>(`/api/transaction?toko_id=${tokoId}`);
        const accepted = all.filter((t) => t.status === "accepted");

        // Step 3 – fetch all users once, then map by id
        const users = await fetchJSON<UserDetail[]>("/api/users");
        const userMap = new Map(users.map((u) => [u.id, u]));

        const resolved = accepted.map((tx) => {
          const user = userMap.get(tx.seller);
          const sellerLabel = user
            ? (user.name ?? user.email)
            : `Pengguna #${tx.seller.slice(0, 8)}…`;
          return { tx, sellerLabel };
        }).reverse(); // newest first

        if (!cancelled) setItems(resolved);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin" style={{ color: "#6FCF97" }} />
    </div>
  );

  if (error) return (
    <div className="px-5 py-4 text-sm rounded-xl mx-5" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
      {error}
    </div>
  );

  if (items.length === 0) return (
    <EmptyState label="Transaksi pembelian toko Anda yang berhasil akan muncul di sini" />
  );

  return (
    <div className="space-y-3 px-5 pb-5">
      {items.map(({ tx, sellerLabel }) => (
        <div
          key={tx.id}
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
            Hanya transaksi dengan status <strong>diterima</strong> yang ditampilkan.
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

        {/* Tab content — scrollable */}
        <div className="overflow-y-auto max-h-[60dvh]">
          {tab === "penjualan" ? (
            <PenjualanTab key={open ? "penjualan-open" : "penjualan"} />
          ) : (
            <PembelianTab key={open ? "pembelian-open" : "pembelian"} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
