import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// GET /api/coaches — list all coaches
export async function GET() {
  const { data, error } = await supabase.from("coaches").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coaches: data });
}

// POST /api/coaches — create a coach WITH a real login account (email + password)
// set by the admin, so the new coach can log in immediately with no
// separate self-registration step.
export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "الباسورد لازم يكون 6 حروف/أرقام على الأقل" }, { status: 400 });
  }

  // Create the Supabase Auth account directly (skips email confirmation
  // since the admin is provisioning it themselves).
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    return NextResponse.json({ error: `فشل إنشاء الحساب: ${authErr.message}` }, { status: 500 });
  }

  const { data: coachRow, error: coachErr } = await supabase
    .from("coaches")
    .insert({ name, email, role: role || "COACH", auth_user_id: authUser.user.id })
    .select()
    .single();

  if (coachErr) {
    // Roll back the auth user if the coaches row failed (e.g. email already used as a coach)
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: coachErr.message }, { status: 500 });
  }

  return NextResponse.json({ coach: coachRow }, { status: 201 });
}
