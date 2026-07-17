import type { Transaksi, TransaksiInput, TransaksiStatusUpdate } from "./types";

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

// GET all transactions
export async function fetchTransaksiList(): Promise<Transaksi[]> {
  return parse<Transaksi[]>(await fetch("/api/transaction", { cache: "no-store" }));
}

// GET transactions where seller = current user
export async function fetchMyTransaksi(): Promise<Transaksi[]> {
  return parse<Transaksi[]>(
    await fetch("/api/transaction?mine=true", { cache: "no-store" }),
  );
}

// GET transactions where buyer = given toko id
export async function fetchTransaksiByTokoId(tokoId: number): Promise<Transaksi[]> {
  return parse<Transaksi[]>(
    await fetch(`/api/transaction?toko_id=${tokoId}`, { cache: "no-store" }),
  );
}

// GET a single transaction by id
export async function fetchTransaksiById(id: number): Promise<Transaksi> {
  return parse<Transaksi>(await fetch(`/api/transaction/${id}`, { cache: "no-store" }));
}

// POST a new transaction
export async function createTransaksi(input: TransaksiInput): Promise<Transaksi> {
  return parse<Transaksi>(
    await fetch("/api/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyer: input.buyer,
        demand: input.demand,
      }),
    }),
  );
}

// PATCH update status of a transaction (accepted | rejected)
export async function updateTransaksiStatus(
  id: number,
  update: TransaksiStatusUpdate,
): Promise<Transaksi> {
  return parse<Transaksi>(
    await fetch(`/api/transaction/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }),
  );
}
