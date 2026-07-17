import type { User } from "./types";

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

// GET all users
export async function fetchUsers(): Promise<User[]> {
  return parse<User[]>(await fetch("/api/users", { cache: "no-store" }));
}
