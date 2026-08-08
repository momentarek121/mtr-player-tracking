import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

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
  const { itemId, completed } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { data, error } = await supabase.from("player_exercises")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", itemId).select().single();
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
