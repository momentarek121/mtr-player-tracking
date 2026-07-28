import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPlayerProgressTrend, getAttendanceRate } from "@/lib/roadmap-engine";

// GET /api/players/:id/analytics — everything the profile dashboard needs
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;

  const [{ data: player }, progressTrend, attendance30, attendance90, { data: physicalTests }, { data: competitions }] =
    await Promise.all([
      supabase.from("players").select("*").eq("id", playerId).single(),
      getPlayerProgressTrend(playerId),
      getAttendanceRate(playerId, 30),
      getAttendanceRate(playerId, 90),
      supabase.from("physical_tests").select("*").eq("player_id", playerId).order("date"),
      supabase.from("competition_results").select("*").eq("player_id", playerId).order("date", { ascending: false }),
    ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const comps = competitions || [];
  const wins = comps.filter((c: any) => c.result.startsWith("WIN")).length;
  const losses = comps.filter((c: any) => c.result.startsWith("LOSS")).length;

  return NextResponse.json({
    player,
    progressTrend,
    attendance: { last30Days: attendance30, last90Days: attendance90 },
    physicalTests,
    competitionRecord: { wins, losses, total: comps.length, results: comps },
  });
}
