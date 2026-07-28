import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/players — list players
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const active = searchParams.get("active");

  let query = supabase.from("players").select("*").order("name");
  if (sport) query = query.eq("sport", sport);
  if (active !== null) query = query.eq("active", active === "true");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ players: data });
}

// POST /api/players — create a new player
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, dob, weightKg, heightCm, sport, currentBelt } = body;

  if (!name || !dob || !weightKg || !sport) {
    return NextResponse.json(
      { error: "name, dob, weightKg, sport are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      name,
      dob,
      weight_kg: weightKg,
      height_cm: heightCm,
      sport,
      current_belt: currentBelt ?? "WHITE",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data }, { status: 201 });
}
