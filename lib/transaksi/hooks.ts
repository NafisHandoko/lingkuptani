"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTransaksi,
  fetchMyTransaksi,
  fetchTransaksiById,
  fetchTransaksiList,
  updateTransaksi,
} from "./api";
import type { Transaksi, TransaksiInput } from "./types";

export const transaksiKeys = {
  all: ["transaksi"] as const,
  lists: () => [...transaksiKeys.all, "list"] as const,
  mine: () => [...transaksiKeys.all, "mine"] as const,
  detail: (id: number) => [...transaksiKeys.all, "detail", id] as const,
};

// All stores (used by the farmer map)
export function useTransaksiList() {
  return useQuery({ queryKey: transaksiKeys.lists(), queryFn: fetchTransaksiList });
}

// Stores owned by the logged-in user (used by "My Store")
export function useMyTransaksi(enabled = true) {
  return useQuery({
    queryKey: transaksiKeys.mine(),
    queryFn: fetchMyTransaksi,
    enabled,
  });
}

// Detail of a single store by id
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

// POST a new store
export function useCreateTransaksi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransaksiInput) => createTransaksi(input),
    onSuccess: () => invalidateTransaksi(qc),
  });
}

//  PATCH update a store
export function useUpdateTransaksi(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransaksiInput): Promise<Transaksi> => updateTransaksi(id, input),
    onSuccess: () => invalidateTransaksi(qc),
  });
}
