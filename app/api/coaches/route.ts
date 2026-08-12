import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// GET /api/coaches — list all coaches
export async function GET() {
  const { data, error } = await supabase.from("coaches").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coaches: data });
}

// POST /api/coaches — create a coach WITH a real login account (email + password)
// set by the admin. If the email is already registered (e.g. the person
// previously signed up as a player), we reuse that existing auth account,
// update its password to the one the admin just set, and link it instead
// of failing.
export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "الباسورد لازم يكون 6 حروف/أرقام على الأقل" }, { status: 400 });
  }

  let authUserId: string;

  const { data: created, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    const alreadyExists = /already.*registered|already.*exists|duplicate/i.test(authErr.message);
    if (!alreadyExists) {
      return NextResponse.json({ error: `فشل إنشاء الحساب: ${authErr.message}` }, { status: 500 });
    }

    // Find the existing auth account by email and reuse it — set the new
    // password the admin chose so it matches what they'll hand out.
    let foundId: string | null = null;
    let page = 1;
    while (!foundId) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr || !list?.users?.length) break;
      const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (match) foundId = match.id;
      if (list.users.length < 200) break;
      page++;
    }

    if (!foundId) {
      return NextResponse.json({ error: `فشل إنشاء الحساب: ${authErr.message}` }, { status: 500 });
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(foundId, { password });
    if (updateErr) {
      return NextResponse.json({ error: `الإيميل ده مسجّل بالفعل ومحصلش تحديث الباسورد: ${updateErr.message}` }, { status: 500 });
    }

    authUserId = foundId;
  } else {
    authUserId = created.user.id;
  }

  // Upsert the coaches row — if this email already exists as a coach (e.g.
  // re-adding), update it instead of erroring on the unique email constraint.
  const { data: coachRow, error: coachErr } = await supabase
    .from("coaches")
    .upsert(
      { name, email, role: role || "COACH", auth_user_id: authUserId },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (coachErr) {
    return NextResponse.json({ error: coachErr.message }, { status: 500 });
  }

  return NextResponse.json({ coach: coachRow }, { status: 201 });
}
