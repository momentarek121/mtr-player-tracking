import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("competition_results").select("*").eq("player_id", params.id).order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitions: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { competitionName, date, sport, weightClass, opponentName, result, notes } = await req.json();
  if (!competitionName || !date || !sport || !result) {
    return NextResponse.json({ error: "competitionName, date, sport, result are required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("competition_results")
    .insert({ player_id: params.id, competition_name: competitionName, date, sport, weight_class: weightClass, opponent_name: opponentName, result, notes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competition: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("competition_results").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
