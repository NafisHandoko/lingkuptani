import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Demand, DemandItem } from "@/lib/toko/types";

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
    const buyer = Number(body.buyer ?? body.toko_id);
    const { demand } = body;

    if (!Number.isFinite(buyer) || buyer <= 0) {
      return NextResponse.json({ error: "buyer is required" }, { status: 400 });
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
          verified: false
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: toko, error: tokoError } = await supabase
      .from("toko")
      .select("id, demand")
      .eq("id", buyer)
      .single();

    if (tokoError) {
      return NextResponse.json({ error: tokoError.message }, { status: 500 });
    }

    const currentDemand = ((toko as { demand?: Demand } | null)?.demand ?? []) as Demand;

    const updatedDemand = currentDemand.map((storeItem: DemandItem) => {
      const soldItem = demand?.find(
        (transactionItem: DemandItem) => transactionItem.commodity === storeItem.commodity,
      );

      if (!soldItem) {
        return storeItem;
      }

      return {
        ...storeItem,
        demand: Math.max(0, Number(storeItem.demand) - Number(soldItem.demand || 0)),
      };
    });

    const { error: updateError } = await supabase
      .from("toko")
      .update({ demand: updatedDemand })
      .eq("id", buyer);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
