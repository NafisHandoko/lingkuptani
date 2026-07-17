"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTransaksi,
  fetchMyTransaksi,
  fetchTransaksiById,
  fetchTransaksiByTokoId,
  fetchTransaksiList,
  updateTransaksiStatus,
} from "./api";
import type { Transaksi, TransaksiInput, TransaksiStatusUpdate } from "./types";

export const transaksiKeys = {
  all: ["transaksi"] as const,
  lists: () => [...transaksiKeys.all, "list"] as const,
  mine: () => [...transaksiKeys.all, "mine"] as const,
  byToko: (tokoId: number) => [...transaksiKeys.all, "toko", tokoId] as const,
  detail: (id: number) => [...transaksiKeys.all, "detail", id] as const,
};

// All transactions
export function useTransaksiList() {
  return useQuery({ queryKey: transaksiKeys.lists(), queryFn: fetchTransaksiList });
}

// Transactions where seller = current user (Penjualan tab)
export function useMyTransaksi(enabled = true) {
  return useQuery({
    queryKey: transaksiKeys.mine(),
    queryFn: fetchMyTransaksi,
    enabled,
  });
}

// Transactions where buyer = given toko id (Pembelian tab + Konfirmasi)
export function useTransaksiByTokoId(tokoId: number | null, enabled = true) {
  return useQuery({
    queryKey: tokoId != null ? transaksiKeys.byToko(tokoId) : transaksiKeys.byToko(-1),
    queryFn: () => fetchTransaksiByTokoId(tokoId as number),
    enabled: tokoId != null && enabled,
  });
}

// Single transaction by id
export function useTransaksi(id: number | null) {
  return useQuery({
    queryKey: id ? transaksiKeys.detail(id) : transaksiKeys.detail(-1),
    queryFn: () => fetchTransaksiById(id as number),
    enabled: id != null,
  });
}

function invalidateTransaksi(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: transaksiKeys.all });
}

// POST a new transaction
export function useCreateTransaksi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransaksiInput): Promise<Transaksi> => createTransaksi(input),
    onSuccess: () => invalidateTransaksi(qc),
  });
}

// PATCH status of a single transaction
export function useUpdateTransaksiStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: TransaksiStatusUpdate }) =>
      updateTransaksiStatus(id, update),
    onSuccess: () => invalidateTransaksi(qc),
  });
}
