import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function getAuthenticatedCoach(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) return null;
  const { data: coach } = await supabase.from("coaches").select("id, name, email, role, auth_user_id").eq("email", userData.user.email).maybeSingle();
  if (!coach || !["ADMIN", "HEAD_COACH", "COACH", "PERFORMANCE_COACH"].includes(coach.role)) return null;
  return coach;
}

export async function getAuthenticatedPerformanceCoach(req: NextRequest) {
  const coach = await getAuthenticatedCoach(req);
  if (!coach || !["ADMIN", "HEAD_COACH", "PERFORMANCE_COACH"].includes(coach.role)) return null;
  return coach;
}
