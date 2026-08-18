import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function getAuthenticatedCoach(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) return null;
  const user = userData.user;
  const { data: linkedCoach } = await supabase.from("coaches").select("id, name, email, role, auth_user_id").eq("auth_user_id", user.id).maybeSingle();
  const { data: emailCoach } = linkedCoach ? { data: null } : await supabase.from("coaches").select("id, name, email, role, auth_user_id").eq("email", user.email).maybeSingle();
  const coach = linkedCoach || emailCoach;
  if (!coach || !["ADMIN", "HEAD_COACH", "COACH", "PERFORMANCE_COACH"].includes(coach.role)) return null;
  if (!coach.auth_user_id) await supabase.from("coaches").update({ auth_user_id: user.id }).eq("id", coach.id);

  return coach;
}

export async function getAuthenticatedPerformanceCoach(req: NextRequest) {
  const coach = await getAuthenticatedCoach(req);
  if (!coach || !["ADMIN", "HEAD_COACH", "PERFORMANCE_COACH"].includes(coach.role)) return null;
  return coach;
}

export async function getAuthenticatedPlayer(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.id) return null;
  const { data: player } = await supabase.from("players").select("id, name, auth_user_id, sport, weight_kg, current_belt").eq("auth_user_id", userData.user.id).maybeSingle();
  return player || null;
}
