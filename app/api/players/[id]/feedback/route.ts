import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_feedback").select("*").eq("player_id", params.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { message, imageUrl } = await req.json();
  if ((!message || !message.trim()) && !imageUrl) {
    return NextResponse.json({ error: "message or imageUrl is required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("player_feedback")
    .insert({ player_id: params.id, message: message?.trim() || "", image_url: imageUrl || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data }, { status: 201 });
}

// PATCH — coach marks reviewed / replies (text and/or photo)
export async function PATCH(req: NextRequest) {
  const { itemId, status, coachReply, coachReplyImageUrl } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const update: Record<string, any> = {};
  if (status !== undefined) update.status = status;
  if (coachReply !== undefined) update.coach_reply = coachReply;
  if (coachReplyImageUrl !== undefined) update.coach_reply_image_url = coachReplyImageUrl;
  const { data, error } = await supabase.from("player_feedback").update(update).eq("id", itemId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
