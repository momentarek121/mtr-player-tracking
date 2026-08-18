import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import { getAuthenticatedCoach } from "@/lib/server-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_exercises").select("*").eq("player_id", params.id).order("assigned_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercises: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { title, description, dueDate } = await req.json();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const { data, error } = await supabase.from("player_exercises")
    .insert({ player_id: params.id, title, description, due_date: dueDate })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data }, { status: 201 });
}

// PATCH — player marks an exercise done, or coach edits it
export async function PATCH(req: NextRequest) {
  const { itemId, playerId, completed, title, description, dueDate, reviewStatus, reviewNote } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (completed !== undefined) { update.completed = completed; update.completed_at = completed ? new Date().toISOString() : null; }
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (dueDate !== undefined) update.due_date = dueDate;
  if (reviewStatus !== undefined || reviewNote !== undefined) {
    const coach = await getAuthenticatedCoach(req);
    if (!coach) return NextResponse.json({ error: "Coach authentication required" }, { status: 401 });
    if (reviewStatus !== undefined) update.review_status = reviewStatus;
    if (reviewNote !== undefined) update.review_note = reviewNote;
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by = coach.id;
  }
  let query = supabase.from("player_exercises").update(update).eq("id", itemId);
  if (playerId) query = query.eq("player_id", playerId);
  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_exercises").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
