import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: camps, error } = await supabase
    .from("fight_camps")
    .select("*")
    .eq("player_id", params.id)
    .order("competition_date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const campIds = (camps || []).map((c: any) => c.id);
  const { data: tasks, error: tasksError } = campIds.length
    ? await supabase.from("fight_camp_tasks").select("*").in("camp_id", campIds).order("due_date", { ascending: true, nullsFirst: false })
    : { data: [], error: null };
  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });
  return NextResponse.json({ camps: camps || [], tasks: tasks || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.type === "task") {
    if (!body.campId || !body.title) return NextResponse.json({ error: "campId and title are required" }, { status: 400 });
    const { data, error } = await supabase.from("fight_camp_tasks").insert({
      camp_id: body.campId,
      title: body.title,
      description: body.description || null,
      category: body.category || "TRAINING",
      due_date: body.dueDate || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data }, { status: 201 });
  }
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const { data, error } = await supabase.from("fight_camps").insert({
    player_id: params.id,
    title: body.title,
    competition_name: body.competitionName || null,
    competition_date: body.competitionDate || null,
    target_weight_kg: body.targetWeightKg || null,
    current_phase: body.currentPhase || "BUILD",
    notes: body.notes || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ camp: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.type === "task") {
    if (!body.itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    const update: Record<string, any> = {};
    if (body.completed !== undefined) {
      update.completed = body.completed;
      update.completed_at = body.completed ? new Date().toISOString() : null;
    }
    if (body.title !== undefined) update.title = body.title;
    if (body.dueDate !== undefined) update.due_date = body.dueDate;
    const { data, error } = await supabase.from("fight_camp_tasks").update(update).eq("id", body.itemId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  }
  if (!body.itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  const update: Record<string, any> = {};
  for (const [from, to] of [["title", "title"], ["competitionName", "competition_name"], ["competitionDate", "competition_date"], ["targetWeightKg", "target_weight_kg"], ["currentPhase", "current_phase"], ["status", "status"], ["notes", "notes"]]) {
    if (body[from] !== undefined) update[to] = body[from];
  }
  const { data, error } = await supabase.from("fight_camps").update({ ...update, updated_at: new Date().toISOString() }).eq("id", body.itemId).eq("player_id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ camp: data });
}
