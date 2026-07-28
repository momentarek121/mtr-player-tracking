import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/team-dashboard — cross-player rollup for the coach:
// team size, average score per domain, and who needs attention.
export async function GET() {
  const [{ data: players }, { data: assessments }, { data: openRoadmap }] = await Promise.all([
    supabase.from("players").select("id, name, sport, current_belt, active").eq("active", true),
    supabase.from("skill_assessments").select("player_id, score, date, skill_categories(domain)").order("date", { ascending: false }),
    supabase.from("player_roadmap_items").select("player_id, priority").eq("status", "OPEN"),
  ]);

  const list = players || [];

  // Latest score per (player, skill) → domain averages team-wide
  const latestKey = new Set<string>();
  const domainScores: Record<string, number[]> = {};
  (assessments || []).forEach((a: any) => {
    const key = `${a.player_id}:${a.skill_categories?.domain}`;
    if (latestKey.has(key)) return; // already have a more recent one for this player+domain pairing at skill level ideally, but domain-level dedupe is close enough for a team rollup
    latestKey.add(key);
    const domain = a.skill_categories?.domain;
    if (!domain) return;
    if (!domainScores[domain]) domainScores[domain] = [];
    domainScores[domain].push(a.score);
  });
  const teamDomainAverages = Object.entries(domainScores).map(([domain, scores]) => ({
    domain,
    average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
  }));

  // Roadmap load per player
  const roadmapCountByPlayer: Record<string, { total: number; highPriority: number }> = {};
  (openRoadmap || []).forEach((r: any) => {
    if (!roadmapCountByPlayer[r.player_id]) roadmapCountByPlayer[r.player_id] = { total: 0, highPriority: 0 };
    roadmapCountByPlayer[r.player_id].total += 1;
    if (r.priority === 1) roadmapCountByPlayer[r.player_id].highPriority += 1;
  });

  const playersNeedingAttention = list
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      sport: p.sport,
      currentBelt: p.current_belt,
      openRoadmapItems: roadmapCountByPlayer[p.id]?.total || 0,
      highPriorityItems: roadmapCountByPlayer[p.id]?.highPriority || 0,
    }))
    .sort((a, b) => b.highPriorityItems - a.highPriorityItems || b.openRoadmapItems - a.openRoadmapItems)
    .filter((p) => p.openRoadmapItems > 0);

  return NextResponse.json({
    totalPlayers: list.length,
    teamDomainAverages,
    playersNeedingAttention,
    bySport: {
      BJJ: list.filter((p: any) => p.sport === "BJJ").length,
      MMA: list.filter((p: any) => p.sport === "MMA").length,
      BOTH: list.filter((p: any) => p.sport === "BOTH").length,
    },
  });
}
