import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("player_attendance")
    .select("*")
    .eq("player_id", params.id)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendance: data });
}

// POST — player self check-in (or coach manual add) for a specific date
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date, markedBy, notes } = await req.json();
  const d = date || new Date().toISOString().slice(0, 10);
  const dayOfWeek = WEEKDAYS[new Date(d + "T12:00:00").getDay()];

  const { data, error } = await supabase
    .from("player_attendance")
    .insert({ player_id: params.id, date: d, day_of_week: dayOfWeek, marked_by: markedBy || "PLAYER", notes })
    .select().single();

  if (error) {
    if (error.message.includes("duplicate")) {
      return NextResponse.json({ error: "الحضور ليوم النهارده متسجّل بالفعل." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ record: data }, { status: 201 });
}

// PATCH — coach edits the date of an attendance record
export async function PATCH(req: NextRequest) {
  const { itemId, date } = await req.json();
  if (!itemId || !date) return NextResponse.json({ error: "itemId and date required" }, { status: 400 });
  const dayOfWeek = WEEKDAYS[new Date(date + "T12:00:00").getDay()];
  const { data, error } = await supabase
    .from("player_attendance")
    .update({ date, day_of_week: dayOfWeek })
    .eq("id", itemId)
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_attendance").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
