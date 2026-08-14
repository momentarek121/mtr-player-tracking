import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("player_rolls").select("*").eq("player_id", params.id).order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rolls: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { partnerName, submissionsLanded, submissionsReceived, notes, date } = await req.json();
  const { data, error } = await supabase.from("player_rolls")
    .insert({
      player_id: params.id,
      partner_name: partnerName || null,
      submissions_landed: submissionsLanded || 0,
      submissions_received: submissionsReceived || 0,
      notes,
      date: date || new Date().toISOString().slice(0, 10),
    })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roll: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_rolls").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
