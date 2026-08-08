import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// GET /api/players/:id/notes — full notes log, newest first
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("player_notes")
    .select("*")
    .eq("player_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data });
}

// POST /api/players/:id/notes — add a new timestamped note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("player_notes")
    .insert({ player_id: params.id, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}
