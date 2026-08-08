import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// PATCH /api/curriculum-items/:itemId — edit title/description
export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  const body = await req.json();
  const update: Record<string, any> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.sortOrder !== undefined) update.sort_order = body.sortOrder;
  const { data, error } = await supabase.from("curriculum_items").update(update).eq("id", params.itemId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE /api/curriculum-items/:itemId — remove a requirement entirely
export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  const { error } = await supabase.from("curriculum_items").delete().eq("id", params.itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
