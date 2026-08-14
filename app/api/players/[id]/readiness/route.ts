import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_readiness").select("*").eq("player_id", params.id).order("date", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ readiness: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sleepQuality, energy, soreness, notes, date } = await req.json();
  if (!sleepQuality || !energy || !soreness) {
    return NextResponse.json({ error: "sleepQuality, energy, soreness are required" }, { status: 400 });
  }
  const d = date || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("player_readiness")
    .upsert(
      { player_id: params.id, sleep_quality: sleepQuality, energy, soreness, notes, date: d },
      { onConflict: "player_id,date" }
    )
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
