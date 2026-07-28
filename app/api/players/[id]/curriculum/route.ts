import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/players/:id/curriculum — belt requirements for this player's
// CURRENT belt, joined with their completion status.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: player } = await supabase.from("players").select("current_belt").eq("id", params.id).single();
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const [{ data: items }, { data: progress }] = await Promise.all([
    supabase.from("curriculum_items").select("*").eq("belt", player.current_belt).order("sort_order"),
    supabase.from("player_curriculum_progress").select("*").eq("player_id", params.id),
  ]);

  const progressMap = new Map((progress || []).map((p: any) => [p.curriculum_item_id, p]));
  const merged = (items || []).map((item: any) => ({
    ...item,
    completed: progressMap.get(item.id)?.completed || false,
    completed_at: progressMap.get(item.id)?.completed_at || null,
  }));

  const completedCount = merged.filter((m: any) => m.completed).length;
  return NextResponse.json({
    belt: player.current_belt,
    items: merged,
    completedCount,
    totalCount: merged.length,
    readyForPromotion: merged.length > 0 && completedCount === merged.length,
  });
}

// POST /api/players/:id/curriculum — toggle a requirement's completion
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { curriculumItemId, completed } = await req.json();
  if (!curriculumItemId) {
    return NextResponse.json({ error: "curriculumItemId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("player_curriculum_progress")
    .upsert(
      {
        player_id: params.id,
        curriculum_item_id: curriculumItemId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "player_id,curriculum_item_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}
