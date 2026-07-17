import type { Transaksi, TransaksiInput } from "./types";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON body
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// GET all stores
export async function fetchTransaksiList(): Promise<Transaksi[]> {
  return parse<Transaksi[]>(await fetch("/api/transaksi", { cache: "no-store" }));
}

// GET stores owned by the currently logged-in user.
export async function fetchMyTransaksi(): Promise<Transaksi[]> {
  return parse<Transaksi[]>(
    await fetch("/api/transaksi?mine=true", { cache: "no-store" }),
  );
}

// GET a single store by id
export async function fetchTransaksiById(id: number): Promise<Transaksi> {
  return parse<Transaksi>(await fetch(`/api/transaksi/${id}`, { cache: "no-store" }));
}

// POST a new store.
export async function createTransaksi(input: TransaksiInput): Promise<Transaksi> {
  return parse<Transaksi>(
    await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

// PATCH update a store by id.
export async function updateTransaksi(id: number, input: TransaksiInput): Promise<Transaksi> {
  return parse<Transaksi>(
    await fetch(`/api/transaksi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
