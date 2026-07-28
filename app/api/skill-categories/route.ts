import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/skill-categories — used to populate the assessment form
export async function GET() {
  const { data, error } = await supabase
    .from("skill_categories")
    .select("*")
    .order("domain");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skillCategories: data });
}
