import { NextRequest, NextResponse } from "next/server";
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

// POST /api/skill-categories — coach adds a brand-new skill/technique
// on the fly (e.g. a specific submission variant not in the seed list).
export async function POST(req: NextRequest) {
  const { name, domain, sport, description } = await req.json();
  if (!name || !domain) {
    return NextResponse.json({ error: "name and domain are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("skill_categories")
    .insert({ name, domain, sport: sport || "BOTH", description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skillCategory: data }, { status: 201 });
}
