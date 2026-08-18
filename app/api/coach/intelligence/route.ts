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
  const nowMs = Date.now();
  const weekStart = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  const previousWeekStart = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: notifications, error: notificationsError }, reportsResult, weeklyData, playerProgressData] = await Promise.all([
    notificationsQuery,
    playerId
      ? supabase.from("player_development_reports").select("*").eq("player_id", playerId).eq("report_type", "LIVE_DEVELOPMENT").maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    !playerId
      ? Promise.all([
          supabase.from("players").select("id, name, sport, weight_kg").eq("approval_status", "APPROVED").limit(500),
          supabase.from("player_exercises").select("player_id, completed, assigned_at").gte("assigned_at", weekStart).limit(2000),
          supabase.from("player_attendance").select("player_id, date").gte("date", weekStart.slice(0, 10)).limit(2000),
          supabase.from("player_weight_log").select("player_id, weight_kg, date").gte("date", weekStart.slice(0, 10)).limit(2000),
          supabase.from("player_chat_insights").select("player_id, category, urgency, created_at").gte("created_at", weekStart).limit(2000),
        ])
      : Promise.resolve(null),
    playerId
      ? Promise.all([
          supabase.from("player_exercises").select("title, completed, completed_at, assigned_at").eq("player_id", playerId).gte("assigned_at", previousWeekStart).order("assigned_at", { ascending: false }).limit(100),
          supabase.from("player_attendance").select("date, notes").eq("player_id", playerId).gte("date", previousWeekStart.slice(0, 10)).order("date", { ascending: false }).limit(100),
          supabase.from("player_weight_log").select("weight_kg, date, notes").eq("player_id", playerId).gte("date", previousWeekStart.slice(0, 10)).order("date", { ascending: false }).limit(100),
          supabase.from("player_chat_insights").select("category, urgency, summary, mindset_signal, recommended_action, created_at").eq("player_id", playerId).gte("created_at", previousWeekStart).order("created_at", { ascending: false }).limit(50),
        ])
      : Promise.resolve(null),
  ]);
  if (notificationsError) return NextResponse.json({ error: notificationsError.message }, { status: 500 });
  let weeklySummaries: any[] = [];
  if (weeklyData) {
    const [playersResult, exercisesResult, attendanceResult, weightsResult, insightsResult] = weeklyData as any[];
    const players = playersResult.data || [];
    const exercises = exercisesResult.data || [];
    const attendance = attendanceResult.data || [];
    const weights = weightsResult.data || [];
    const insights = insightsResult.data || [];
    weeklySummaries = players.map((p: any) => {
      const px = exercises.filter((x: any) => x.player_id === p.id);
      const pa = attendance.filter((x: any) => x.player_id === p.id);
      const pi = insights.filter((x: any) => x.player_id === p.id);
      const pw = weights.filter((x: any) => x.player_id === p.id).sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
      const completed = px.filter((x: any) => x.completed).length;
      const adherence = px.length ? Math.round((completed / px.length) * 100) : null;
      const high = pi.filter((x: any) => x.urgency === "HIGH").length;
      const firstWeight = pw[0]?.weight_kg ?? null;
      const lastWeight = pw[pw.length - 1]?.weight_kg ?? p.weight_kg ?? null;
      return { playerId: p.id, playerName: p.name, sport: p.sport, weightKg: p.weight_kg, weightStartKg: firstWeight, weightEndKg: lastWeight, weightDeltaKg: firstWeight !== null && lastWeight !== null ? Number((lastWeight - firstWeight).toFixed(1)) : null, exercisesAssigned: px.length, exercisesCompleted: completed, adherencePercent: adherence, attendanceCount: pa.length, chatSignals: pi.length, highPrioritySignals: high, topSignal: pi.reduce((acc: Record<string, number>, x: any) => { acc[x.category] = (acc[x.category] || 0) + 1; return acc; }, {}) };
    }).sort((a: any, b: any) => (b.highPrioritySignals - a.highPrioritySignals) || ((a.adherencePercent ?? 101) - (b.adherencePercent ?? 101)));
  }
  let progress: any = null;
  if (playerProgressData) {
    const [exerciseResult, attendanceResult, weightResult, insightResult] = playerProgressData as any[];
    const ex = exerciseResult.data || [];
    const att = attendanceResult.data || [];
    const weights = weightResult.data || [];
    const insights = insightResult.data || [];
    const currentExercises = ex.filter((x: any) => String(x.assigned_at) >= weekStart);
    const previousExercises = ex.filter((x: any) => String(x.assigned_at) < weekStart);
    const currentAttendance = att.filter((x: any) => String(x.date) >= weekStart.slice(0, 10));
    const previousAttendance = att.filter((x: any) => String(x.date) < weekStart.slice(0, 10));
    const currentInsights = insights.filter((x: any) => String(x.created_at) >= weekStart);
    const previousInsights = insights.filter((x: any) => String(x.created_at) < weekStart);
    const completed = currentExercises.filter((x: any) => x.completed).length;
    const adherence = currentExercises.length ? Math.round((completed / currentExercises.length) * 100) : null;
    const previousCompleted = previousExercises.filter((x: any) => x.completed).length;
    const previousAdherence = previousExercises.length ? Math.round((previousCompleted / previousExercises.length) * 100) : null;
    const sortedWeights = [...weights].sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
    const currentWeights = sortedWeights.filter((x: any) => String(x.date) >= weekStart.slice(0, 10));
    const previousWeights = sortedWeights.filter((x: any) => String(x.date) < weekStart.slice(0, 10));
    const weightStartKg = currentWeights[0]?.weight_kg ?? null;
    const weightEndKg = currentWeights[currentWeights.length - 1]?.weight_kg ?? null;
    const previousWeightStartKg = previousWeights[0]?.weight_kg ?? null;
    const previousWeightEndKg = previousWeights[previousWeights.length - 1]?.weight_kg ?? null;
    const counts: Record<string, number> = {};
    currentInsights.forEach((x: any) => { counts[x.category] = (counts[x.category] || 0) + 1; });
    const topSignal = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "OTHER";
    const blocker = adherence !== null && adherence < 50 ? "الالتزام بالتمارين منخفض ويحتاج تدخلًا مباشرًا." : insights.some((x: any) => x.urgency === "HIGH") ? "هناك إشارة عالية الأولوية تحتاج متابعة قبل زيادة الحمل." : "لا يوجد تعثر واضح من البيانات الحالية.";
    const recommendation = insights.some((x: any) => x.category === "WEIGHT_NUTRITION") ? "راجع خطة الوزن والتغذية مع اللاعب واربطها بموعد البطولة والوزن المستهدف." : adherence !== null && adherence < 70 ? "قلل حجم الخطة إلى خطوات قابلة للإنجاز وحدد متابعة قصيرة خلال 48 ساعة." : "حافظ على الحمل الحالي وأضف تقييمًا فنيًا أو بدنيًا جديدًا في نهاية الأسبوع.";
    progress = { periodStart: weekStart, previousPeriodStart: previousWeekStart, generatedAt: new Date().toISOString(), exerciseCount: currentExercises.length, completedExercises: completed, adherencePercent: adherence, attendanceCount: currentAttendance.length, weightStartKg, weightEndKg, weightDeltaKg: weightStartKg !== null && weightEndKg !== null ? Number((weightEndKg - weightStartKg).toFixed(1)) : null, signalCounts: counts, topSignal, blocker, recommendation, recentExercises: currentExercises.slice(0, 10), recentAttendance: currentAttendance.slice(0, 10), recentWeights: currentWeights.slice(-10).reverse(), recentInsights: currentInsights.slice(0, 12), comparison: { previousExerciseCount: previousExercises.length, previousCompletedExercises: previousCompleted, previousAdherencePercent: previousAdherence, adherenceDelta: adherence !== null && previousAdherence !== null ? adherence - previousAdherence : null, previousAttendanceCount: previousAttendance.length, attendanceDelta: currentAttendance.length - previousAttendance.length, previousWeightStartKg, previousWeightEndKg, previousWeightDeltaKg: previousWeightStartKg !== null && previousWeightEndKg !== null ? Number((previousWeightEndKg - previousWeightStartKg).toFixed(1)) : null, currentInsightCount: currentInsights.length, previousInsightCount: previousInsights.length, insightDelta: currentInsights.length - previousInsights.length } };
  }
  return NextResponse.json({ notifications: notifications || [], report: reportsResult.data || null, progress, unreadCount: (notifications || []).filter((n: any) => !n.read_at).length, weeklySummaries });
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
