import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("player_goals")
    .select("*")
    .eq("player_id", params.id)
    .order("target_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { title, description, targetDate } = await req.json();
  if (!title || !targetDate) return NextResponse.json({ error: "title and targetDate required" }, { status: 400 });
  const { data, error } = await supabase
    .from("player_goals")
    .insert({ player_id: params.id, title, description, target_date: targetDate, source: "COACH" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { itemId, title, description, targetDate, status } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (targetDate !== undefined) update.target_date = targetDate;
  if (status !== undefined) update.status = status;
  const { data, error } = await supabase.from("player_goals").update(update).eq("id", itemId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_goals").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
