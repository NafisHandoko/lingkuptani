import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// POST /api/auth/register — JSON signup endpoint. Returns JSON (not an HTML/RSC
// redirect) because it lives under /api/auth (excluded from the auth middleware).
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      const message =
        error.message === "User already registered"
          ? "Email sudah terdaftar. Silakan masuk."
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { user: { id: data.user?.id, email: data.user?.email } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
