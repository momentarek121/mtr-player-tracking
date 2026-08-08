import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// GET /api/players/:id/attachments — files/photos linked to this player
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("player_attachments")
    .select("*")
    .eq("player_id", params.id)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachments: data });
}

// POST /api/players/:id/attachments — save metadata AFTER the file itself
// was already uploaded client-side directly to Supabase Storage.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { fileName, fileUrl, fileType, notes } = await req.json();
  if (!fileName || !fileUrl) {
    return NextResponse.json({ error: "fileName and fileUrl are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("player_attachments")
    .insert({ player_id: params.id, file_name: fileName, file_url: fileUrl, file_type: fileType, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachment: data }, { status: 201 });
}
