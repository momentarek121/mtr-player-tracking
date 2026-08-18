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
  const [{ data: notifications, error: notificationsError }, reportsResult] = await Promise.all([
    notificationsQuery,
    playerId
      ? supabase.from("player_development_reports").select("*").eq("player_id", playerId).eq("report_type", "LIVE_DEVELOPMENT").maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (notificationsError) return NextResponse.json({ error: notificationsError.message }, { status: 500 });
  return NextResponse.json({ notifications: notifications || [], report: reportsResult.data || null, unreadCount: (notifications || []).filter((n: any) => !n.read_at).length });
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
