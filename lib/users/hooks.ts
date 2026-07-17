"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./api";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
};

/** Fetch all users. Pass enabled=false to defer until needed. */
export function useUsers(enabled = true) {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
    enabled,
    // Users list changes rarely — keep it fresh for 2 min
    staleTime: 2 * 60 * 1000,
  });
}
