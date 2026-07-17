import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ?mine=true => only stores owned by the currently logged-in user.
    const mine = new URL(request.url).searchParams.get("mine") === "true";
    const toko_id = new URL(request.url).searchParams.get("toko_id")

    let query = supabase
      .from("transaction")
      .select("*")
      .order("created_at", { ascending: true });

    if (mine) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      query = query.eq("seller", session.user.id);
    }

    if (toko_id) {
        query = query.eq("buyer", toko_id)
    }


    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyer, demand } = body;

    if (!buyer) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transaction")
      .insert([
        {
          buyer,
          demand,
          seller: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
