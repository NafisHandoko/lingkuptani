import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// Diagnostic endpoint: shows the current auth state as JSON.
// Lives under /api/auth so the middleware does NOT redirect it to /login,
// which means it always returns JSON (even when not logged in) instead of HTML.
export async function GET() {
  const supabase = await createSupabaseServer();

  // getUser() validates the token with Supabase (more trustworthy than getSession).
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return NextResponse.json({
    authenticated: !!user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    hasSession: !!session,
    error: error?.message ?? null,
  });
}
