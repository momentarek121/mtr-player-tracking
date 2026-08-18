import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import { getAuthenticatedCoach } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const coach = await getAuthenticatedCoach(req);
  if (!coach) return NextResponse.json({ error: "Coach authentication required" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  let notificationsQuery = supabase.from("coach_notifications").select("id, player_id, insight_id, notification_type, title, body, severity, metadata, read_at, created_at, players(name, player_code)").order("created_at", { ascending: false }).limit(100);
  if (playerId) notificationsQuery = notificationsQuery.eq("player_id", playerId);
  if (unreadOnly) notificationsQuery = notificationsQuery.is("read_at", null);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: notifications, error: notificationsError }, reportsResult, weeklyData] = await Promise.all([
    notificationsQuery,
    playerId
      ? supabase.from("player_development_reports").select("*").eq("player_id", playerId).eq("report_type", "LIVE_DEVELOPMENT").maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    !playerId
      ? Promise.all([
          supabase.from("players").select("id, name, sport, weight_kg").eq("approval_status", "APPROVED").limit(500),
          supabase.from("player_exercises").select("player_id, completed, assigned_at").gte("assigned_at", weekStart).limit(2000),
          supabase.from("player_attendance").select("player_id, date").gte("date", weekStart.slice(0, 10)).limit(2000),
          supabase.from("player_chat_insights").select("player_id, category, urgency, created_at").gte("created_at", weekStart).limit(2000),
        ])
      : Promise.resolve(null),
  ]);
  if (notificationsError) return NextResponse.json({ error: notificationsError.message }, { status: 500 });
  let weeklySummaries: any[] = [];
  if (weeklyData) {
    const [playersResult, exercisesResult, attendanceResult, insightsResult] = weeklyData as any[];
    const players = playersResult.data || [];
    const exercises = exercisesResult.data || [];
    const attendance = attendanceResult.data || [];
    const insights = insightsResult.data || [];
    weeklySummaries = players.map((p: any) => {
      const px = exercises.filter((x: any) => x.player_id === p.id);
      const pa = attendance.filter((x: any) => x.player_id === p.id);
      const pi = insights.filter((x: any) => x.player_id === p.id);
      const completed = px.filter((x: any) => x.completed).length;
      const adherence = px.length ? Math.round((completed / px.length) * 100) : null;
      const high = pi.filter((x: any) => x.urgency === "HIGH").length;
      return { playerId: p.id, playerName: p.name, sport: p.sport, weightKg: p.weight_kg, exercisesAssigned: px.length, exercisesCompleted: completed, adherencePercent: adherence, attendanceCount: pa.length, chatSignals: pi.length, highPrioritySignals: high, topSignal: pi.reduce((acc: Record<string, number>, x: any) => { acc[x.category] = (acc[x.category] || 0) + 1; return acc; }, {}) };
    }).sort((a: any, b: any) => (b.highPrioritySignals - a.highPrioritySignals) || ((a.adherencePercent ?? 101) - (b.adherencePercent ?? 101)));
  }
  return NextResponse.json({ notifications: notifications || [], report: reportsResult.data || null, unreadCount: (notifications || []).filter((n: any) => !n.read_at).length, weeklySummaries });
}

export async function PATCH(req: NextRequest) {
  const coach = await getAuthenticatedCoach(req);
  if (!coach) return NextResponse.json({ error: "Coach authentication required" }, { status: 401 });
  const { notificationId, insightId } = await req.json();
  const now = new Date().toISOString();
  if (notificationId) {
    const { error } = await supabase.from("coach_notifications").update({ read_at: now, read_by: coach.id }).eq("id", notificationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (insightId) {
    const { error } = await supabase.from("player_chat_insights").update({ status: "ACKNOWLEDGED", acknowledged_at: now, acknowledged_by: coach.id }).eq("id", insightId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
