import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import { getAuthenticatedCoach } from "@/lib/server-auth";

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
  const { itemId, playerId, title, description, targetDate, status, reviewStatus, reviewNote } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (targetDate !== undefined) update.target_date = targetDate;
  if (status !== undefined) update.status = status;
  if (reviewStatus !== undefined || reviewNote !== undefined) {
    const coach = await getAuthenticatedCoach(req);
    if (!coach) return NextResponse.json({ error: "Coach authentication required" }, { status: 401 });
    if (reviewStatus !== undefined) update.review_status = reviewStatus;
    if (reviewNote !== undefined) update.review_note = reviewNote;
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by = coach.id;
  }
  let query = supabase.from("player_goals").update(update).eq("id", itemId);
  if (playerId) query = query.eq("player_id", playerId);
  const { data, error } = await query.select().single();
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
