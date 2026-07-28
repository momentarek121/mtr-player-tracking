import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateRoadmapForPlayer } from "@/lib/roadmap-engine";

// GET /api/players/:id/assessments — full assessment history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("skill_assessments")
    .select("*, skill_categories(name, domain)")
    .eq("player_id", params.id)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessments: data });
}

// POST /api/players/:id/assessments — record new score(s), then refresh the roadmap
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];

  for (const item of items) {
    if (!item.skillCategoryId || item.score === undefined || item.score < 1 || item.score > 10) {
      return NextResponse.json(
        { error: "Each item needs skillCategoryId and score (1–10)" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase.from("skill_assessments").insert(
    items.map((item: any) => ({
      player_id: params.id,
      skill_category_id: item.skillCategoryId,
      score: item.score,
      notes: item.notes,
      date: item.date ?? new Date().toISOString(),
    }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const openRoadmapItems = await generateRoadmapForPlayer(params.id);
  return NextResponse.json({ success: true, openRoadmapItems }, { status: 201 });
}
