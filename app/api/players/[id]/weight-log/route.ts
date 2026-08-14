import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_weight_log").select("*").eq("player_id", params.id).order("date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { weightKg, date, notes } = await req.json();
  if (!weightKg) return NextResponse.json({ error: "weightKg required" }, { status: 400 });
  const { data, error } = await supabase.from("player_weight_log")
    .insert({ player_id: params.id, weight_kg: weightKg, date: date || new Date().toISOString().slice(0, 10), notes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // keep the player's current weight in sync
  await supabase.from("players").update({ weight_kg: weightKg }).eq("id", params.id);
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_weight_log").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
