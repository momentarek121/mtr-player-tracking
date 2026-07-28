import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateRoadmapForPlayer } from "@/lib/roadmap-engine";

// GET /api/players/:id/roadmap — current development priorities
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("player_roadmap_items")
    .select("*")
    .eq("player_id", params.id)
    .eq("status", "OPEN")
    .order("priority");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roadmap: data });
}

// POST /api/players/:id/roadmap — force a re-scan against latest scores
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const items = await generateRoadmapForPlayer(params.id);
  return NextResponse.json({ roadmap: items });
}
