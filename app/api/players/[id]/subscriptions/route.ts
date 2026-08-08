import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("player_subscriptions")
    .select("*")
    .eq("player_id", params.id)
    .order("end_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscriptions: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { planName, amount, startDate, endDate, notes } = await req.json();
  if (!planName || !endDate) return NextResponse.json({ error: "planName and endDate are required" }, { status: 400 });
  const { data, error } = await supabase
    .from("player_subscriptions")
    .insert({
      player_id: params.id,
      plan_name: planName,
      amount,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      end_date: endDate,
      notes,
    })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscription: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const { error } = await supabase.from("player_subscriptions").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
