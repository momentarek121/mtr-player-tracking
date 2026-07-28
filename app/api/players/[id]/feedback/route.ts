import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_feedback").select("*").eq("player_id", params.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { message } = await req.json();
  if (!message || !message.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });
  const { data, error } = await supabase.from("player_feedback")
    .insert({ player_id: params.id, message: message.trim() })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data }, { status: 201 });
}

// PATCH — coach marks reviewed / replies
export async function PATCH(req: NextRequest) {
  const { itemId, status, coachReply } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (status !== undefined) update.status = status;
  if (coachReply !== undefined) update.coach_reply = coachReply;
  const { data, error } = await supabase.from("player_feedback").update(update).eq("id", itemId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
