import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// POST /api/auth/login — JSON auth endpoint.
// Lives under /api/auth so the middleware does NOT redirect it, so it always
// returns JSON (not an HTML/RSC redirect). On success Supabase sets the session
// cookie on the response, logging the user in.
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message =
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : error.message;
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: data.user?.id, email: data.user?.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
