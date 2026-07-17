import type { Toko, TokoInput } from "./types";

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
export async function fetchTokoList(): Promise<Toko[]> {
  return parse<Toko[]>(await fetch("/api/toko", { cache: "no-store" }));
}

// GET stores owned by the currently logged-in user.
export async function fetchMyToko(): Promise<Toko[]> {
  return parse<Toko[]>(
    await fetch("/api/toko?mine=true", { cache: "no-store" }),
  );
}

// GET a single store by id
export async function fetchTokoById(id: number): Promise<Toko> {
  return parse<Toko>(await fetch(`/api/toko/${id}`, { cache: "no-store" }));
}

// POST a new store.
export async function createToko(input: TokoInput): Promise<Toko> {
  return parse<Toko>(
    await fetch("/api/toko", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

// PATCH update a store by id.
export async function updateToko(id: number, input: TokoInput): Promise<Toko> {
  return parse<Toko>(
    await fetch(`/api/toko/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
