import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/players/:id — single player record
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase.from("players").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ player: data });
}

// PATCH /api/players/:id — edit name/dob/weight/sport/belt/notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const update: Record<string, any> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.dob !== undefined) update.dob = body.dob;
  if (body.weightKg !== undefined) update.weight_kg = body.weightKg;
  if (body.heightCm !== undefined) update.height_cm = body.heightCm;
  if (body.sport !== undefined) update.sport = body.sport;
  if (body.currentBelt !== undefined) update.current_belt = body.currentBelt;
  if (body.stripes !== undefined) update.stripes = body.stripes;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.active !== undefined) update.active = body.active;
  if (body.approvalStatus !== undefined) update.approval_status = body.approvalStatus;
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("players").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data });
}

// DELETE /api/players/:id — remove a player entirely
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase.from("players").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
