import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

async function canManagePlayer(coachId: string, playerId: string) {
  const { data } = await supabase.from("performance_coach_players").select("id").eq("coach_id", coachId).eq("player_id", playerId).eq("active", true).maybeSingle();
  return !!data;
}

async function getManagedProgram(coachId: string, programId: string) {
  const { data: program } = await supabase.from("performance_programs").select("id, player_id").eq("id", programId).eq("coach_id", coachId).maybeSingle();
  if (!program || !(await canManagePlayer(coachId, program.player_id))) return null;
  return program;
}

export async function GET(req: NextRequest) {
  const coachId = new URL(req.url).searchParams.get("coachId");
  if (!coachId) return NextResponse.json({ error: "coachId is required" }, { status: 400 });
  const [{ data: assignments, error: assignmentError }, { data: players, error: playersError }] = await Promise.all([
    supabase.from("performance_coach_players").select("id, coach_id, player_id, active, players(*)").eq("coach_id", coachId).eq("active", true).order("created_at"),
    supabase.from("players").select("id, name, player_code, sport, current_belt, weight_kg, height_cm, photo_url, active, approval_status").eq("approval_status", "APPROVED").eq("active", true).order("name"),
  ]);
  if (assignmentError || playersError) return NextResponse.json({ error: assignmentError?.message || playersError?.message }, { status: 500 });
  const playerIds = (assignments || []).map((a: any) => a.player_id);
  const { data: programs, error: programsError } = playerIds.length
    ? await supabase.from("performance_programs").select("*").eq("coach_id", coachId).in("player_id", playerIds).order("start_date", { ascending: false, nullsFirst: false })
    : { data: [], error: null };
  if (programsError) return NextResponse.json({ error: programsError.message }, { status: 500 });
  const programIds = (programs || []).map((p: any) => p.id);
  const { data: items, error: itemsError } = programIds.length
    ? await supabase.from("performance_program_items").select("*").in("program_id", programIds).order("created_at")
    : { data: [], error: null };
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  const [{ data: readiness }, { data: weightLog }, { data: fightCamps }, { data: attachments }] = playerIds.length
    ? await Promise.all([
        supabase.from("player_readiness").select("*").in("player_id", playerIds).order("date", { ascending: false }),
        supabase.from("player_weight_log").select("*").in("player_id", playerIds).order("date", { ascending: false }),
        supabase.from("fight_camps").select("*").in("player_id", playerIds).eq("status", "ACTIVE").order("competition_date", { ascending: true, nullsFirst: false }),
        supabase.from("player_attachments").select("id, player_id, file_name, file_type, file_url, caption, stage, uploaded_at").in("player_id", playerIds).order("uploaded_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const itemIds = (items || []).map((item: any) => item.id);
  const { data: itemMedia } = itemIds.length
    ? await supabase.from("performance_item_media").select("id, item_id, attachment_id, timestamp_sec, note, player_attachments(file_name, file_type, file_url, caption)").in("item_id", itemIds).order("created_at", { ascending: false })
    : { data: [] };
  return NextResponse.json({ assignments: assignments || [], players: players || [], programs: programs || [], items: items || [], readiness: readiness || [], weightLog: weightLog || [], fightCamps: fightCamps || [], attachments: attachments || [], itemMedia: itemMedia || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === "assignment") {
    if (!body.coachId || !body.playerId) return NextResponse.json({ error: "coachId and playerId are required" }, { status: 400 });
    const { data, error } = await supabase.from("performance_coach_players").upsert({ coach_id: body.coachId, player_id: body.playerId, assigned_by: body.assignedBy || null, active: true }, { onConflict: "coach_id,player_id" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignment: data }, { status: 201 });
  }
  if (body.type === "item") {
    if (!body.coachId || !body.programId || !body.exerciseName) return NextResponse.json({ error: "coachId, programId and exerciseName are required" }, { status: 400 });
    if (!(await getManagedProgram(body.coachId, body.programId))) return NextResponse.json({ error: "البرنامج غير تابع للاعب مسند لهذا المدرب" }, { status: 403 });
    const { data, error } = await supabase.from("performance_program_items").insert({ program_id: body.programId, day_label: body.dayLabel || null, exercise_name: body.exerciseName, category: body.category || "STRENGTH", sets: body.sets || null, reps: body.reps || null, load: body.load || null, rest: body.rest || null, instructions: body.instructions || null }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data }, { status: 201 });
  }
  if (body.type === "media") {
    if (!body.coachId || !body.itemId || !body.attachmentId) return NextResponse.json({ error: "coachId, itemId and attachmentId are required" }, { status: 400 });
    const { data: item } = await supabase.from("performance_program_items").select("id, program_id").eq("id", body.itemId).maybeSingle();
    if (!item || !(await getManagedProgram(body.coachId, item.program_id))) return NextResponse.json({ error: "التمرين غير تابع لهذا المدرب" }, { status: 403 });
    const { data, error } = await supabase.from("performance_item_media").insert({ item_id: body.itemId, attachment_id: body.attachmentId, timestamp_sec: body.timestampSec || null, note: body.note || null, created_by: body.coachId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ media: data }, { status: 201 });
  }
  if (!body.coachId || !body.playerId || !body.title) return NextResponse.json({ error: "coachId, playerId and title are required" }, { status: 400 });
  if (!(await canManagePlayer(body.coachId, body.playerId))) return NextResponse.json({ error: "اللاعب غير مسند لهذا المدرب" }, { status: 403 });
  const { data, error } = await supabase.from("performance_programs").insert({ coach_id: body.coachId, player_id: body.playerId, title: body.title, goal: body.goal || null, start_date: body.startDate || null, end_date: body.endDate || null, notes: body.notes || null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ program: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (body.type === "item") {
    if (!body.coachId || !body.itemId) return NextResponse.json({ error: "coachId and itemId are required" }, { status: 400 });
    const { data: itemRow } = await supabase.from("performance_program_items").select("id, program_id").eq("id", body.itemId).maybeSingle();
    if (!itemRow || !(await getManagedProgram(body.coachId, itemRow.program_id))) return NextResponse.json({ error: "التمرين غير تابع لهذا المدرب" }, { status: 403 });
    const update: Record<string, any> = {};
    if (body.completed !== undefined) { update.completed = body.completed; update.completed_at = body.completed ? new Date().toISOString() : null; }
    if (body.instructions !== undefined) update.instructions = body.instructions;
    const { data, error } = await supabase.from("performance_program_items").update(update).eq("id", body.itemId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }
  if (!body.programId) return NextResponse.json({ error: "programId is required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.goal !== undefined) update.goal = body.goal;
  if (body.notes !== undefined) update.notes = body.notes;
  const { data, error } = await supabase.from("performance_programs").update({ ...update, updated_at: new Date().toISOString() }).eq("id", body.programId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ program: data });
}

export async function DELETE(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const coachId = params.get("coachId");
  const playerId = params.get("playerId");
  if (!coachId || !playerId) return NextResponse.json({ error: "coachId and playerId are required" }, { status: 400 });
  const { error } = await supabase.from("performance_coach_players").update({ active: false }).eq("coach_id", coachId).eq("player_id", playerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
