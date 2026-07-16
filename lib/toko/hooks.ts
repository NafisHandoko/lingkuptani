"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createToko,
  fetchMyToko,
  fetchTokoById,
  fetchTokoList,
  updateToko,
} from "./api";
import type { Toko, TokoInput } from "./types";

export const tokoKeys = {
  all: ["toko"] as const,
  lists: () => [...tokoKeys.all, "list"] as const,
  mine: () => [...tokoKeys.all, "mine"] as const,
  detail: (id: number) => [...tokoKeys.all, "detail", id] as const,
};

// All stores (used by the farmer map)
export function useTokoList() {
  return useQuery({ queryKey: tokoKeys.lists(), queryFn: fetchTokoList });
}

// Stores owned by the logged-in user (used by "My Store")
export function useMyToko(enabled = true) {
  return useQuery({
    queryKey: tokoKeys.mine(),
    queryFn: fetchMyToko,
    enabled,
  });
}

// Detail of a single store by id
export function useToko(id: number | null) {
  return useQuery({
    queryKey: id ? tokoKeys.detail(id) : tokoKeys.detail(-1),
    queryFn: () => fetchTokoById(id as number),
    enabled: id != null,
  });
}

function invalidateToko(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: tokoKeys.all });
}

// POST a new store
export function useCreateToko() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TokoInput) => createToko(input),
    onSuccess: () => invalidateToko(qc),
  });
}

//  PATCH update a store
export function useUpdateToko(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TokoInput): Promise<Toko> => updateToko(id, input),
    onSuccess: () => invalidateToko(qc),
  });
}
