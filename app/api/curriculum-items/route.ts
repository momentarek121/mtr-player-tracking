import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/curriculum-items?belt=WHITE — all requirements for a belt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const belt = searchParams.get("belt");
  let query = supabase.from("curriculum_items").select("*").order("sort_order");
  if (belt) query = query.eq("belt", belt);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// POST /api/curriculum-items — coach adds a new requirement to a belt
export async function POST(req: NextRequest) {
  const { belt, title, description, sport, sortOrder } = await req.json();
  if (!belt || !title) return NextResponse.json({ error: "belt and title are required" }, { status: 400 });
  const { data, error } = await supabase.from("curriculum_items")
    .insert({ belt, title, description, sport: sport || "BOTH", sort_order: sortOrder ?? 0 })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
