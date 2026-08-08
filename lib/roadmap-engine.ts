import { supabase } from "./supabase-admin";

/**
 * Roadmap Engine
 * ----------------
 * For a given player:
 *  1. Pulls the LATEST assessment per skill category.
 *  2. Compares each latest score against active roadmap_rules.
 *  3. Any rule whose threshold is breached (score < rule.score_below)
 *     generates/updates a player_roadmap_items row.
 */
export async function generateRoadmapForPlayer(playerId: string) {
  const { data: assessments } = await supabase
    .from("skill_assessments")
    .select("skill_category_id, score, date, skill_categories(name)")
    .eq("player_id", playerId)
    .order("date", { ascending: false });

  const latestPerSkill = new Map<string, number>();
  (assessments || []).forEach((a: any) => {
    if (!latestPerSkill.has(a.skill_category_id)) {
      latestPerSkill.set(a.skill_category_id, a.score);
    }
  });

  const { data: rules } = await supabase
    .from("roadmap_rules")
    .select("id, name, skill_category_id, score_below, recommendation, priority, skill_categories(name)")
    .eq("active", true);

  const triggeredRuleIds = new Set<string>();
  const toInsert: any[] = [];

  for (const rule of rules || []) {
    const latestScore = latestPerSkill.get(rule.skill_category_id);
    if (latestScore === undefined) continue;
    if (latestScore < rule.score_below) {
      triggeredRuleIds.add(rule.id);
      toInsert.push({
        player_id: playerId,
        rule_id: rule.id,
        title: `${(rule as any).skill_categories?.name}: ${rule.name}`,
        recommendation: rule.recommendation,
        priority: rule.priority,
      });
    }
  }

  const { data: existingOpen } = await supabase
    .from("player_roadmap_items")
    .select("id, rule_id")
    .eq("player_id", playerId)
    .eq("status", "OPEN");

  const existingRuleIds = new Set((existingOpen || []).map((i: any) => i.rule_id));
  const newItems = toInsert.filter((i) => !existingRuleIds.has(i.rule_id));

  if (newItems.length > 0) {
    await supabase.from("player_roadmap_items").insert(newItems);
  }

  // Auto-resolve items whose underlying weakness improved
  const toResolve = (existingOpen || []).filter(
    (i: any) => i.rule_id && !triggeredRuleIds.has(i.rule_id)
  );
  for (const item of toResolve) {
    await supabase
      .from("player_roadmap_items")
      .update({ status: "RESOLVED", resolved_at: new Date().toISOString() })
      .eq("id", (item as any).id);
  }

  const { data: openItems } = await supabase
    .from("player_roadmap_items")
    .select("*")
    .eq("player_id", playerId)
    .eq("status", "OPEN")
    .order("priority");

  return openItems || [];
}

/** Monthly average score per skill domain — feeds the progress trend chart. */
export async function getPlayerProgressTrend(playerId: string) {
  const { data: assessments } = await supabase
    .from("skill_assessments")
    .select("score, date, skill_categories(domain)")
    .eq("player_id", playerId)
    .order("date", { ascending: true });

  const buckets = new Map<string, Record<string, number[]>>();
  (assessments || []).forEach((a: any) => {
    const monthKey = a.date.slice(0, 7);
    const domain = a.skill_categories?.domain;
    if (!domain) return;
    if (!buckets.has(monthKey)) buckets.set(monthKey, {});
    const b = buckets.get(monthKey)!;
    if (!b[domain]) b[domain] = [];
    b[domain].push(a.score);
  });

  return Array.from(buckets.entries()).map(([month, domains]) => {
    const row: Record<string, number | string> = { month };
    for (const [domain, scores] of Object.entries(domains)) {
      row[domain] = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
    }
    return row;
  });
}

/** Attendance rate over the last N days. */
export async function getAttendanceRate(playerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { count: totalSessions } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .gte("date", sinceIso);

  const { count: attended } = await supabase
    .from("attendance")
    .select("*, training_sessions!inner(date)", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("present", true)
    .gte("training_sessions.date", sinceIso);

  const total = totalSessions || 0;
  const att = attended || 0;

  return {
    days,
    totalSessions: total,
    attended: att,
    rate: total > 0 ? Math.round((att / total) * 100) : 0,
  };
}
