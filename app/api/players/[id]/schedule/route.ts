import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_schedule").select("*").eq("player_id", params.id).order("day_of_week");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { dayOfWeek, timeLabel, activity, notes } = await req.json();
  if (!dayOfWeek || !activity) return NextResponse.json({ error: "dayOfWeek and activity are required" }, { status: 400 });
  const { data, error } = await supabase.from("player_schedule")
    .insert({ player_id: params.id, day_of_week: dayOfWeek, time_label: timeLabel, activity, notes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_schedule").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
