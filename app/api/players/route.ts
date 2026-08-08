import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

// GET /api/players — list players
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const active = searchParams.get("active");
  const approvalStatus = searchParams.get("approvalStatus");

  let query = supabase.from("players").select("*").order("name");
  if (sport) query = query.eq("sport", sport);
  if (active !== null) query = query.eq("active", active === "true");
  if (approvalStatus) query = query.eq("approval_status", approvalStatus);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ players: data });
}

function generatePlayerCode(name: string) {
  const base =
    (name.trim().split(" ")[0] || "PLR")
      .replace(/[^a-zA-Zء-ي]/g, "")
      .toUpperCase()
      .slice(0, 4) || "PLR";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}

// POST /api/players — create a new player
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, dob, weightKg, heightCm, sport, currentBelt } = body;

  if (!name || !dob || !weightKg || !sport) {
    return NextResponse.json(
      { error: "name, dob, weightKg, sport are required" },
      { status: 400 }
    );
  }

  // Retry a few times in the rare case of a code collision (unique constraint)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("players")
      .insert({
        name,
        dob,
        weight_kg: weightKg,
        height_cm: heightCm,
        sport,
        current_belt: currentBelt ?? "WHITE",
        player_code: generatePlayerCode(name),
      })
      .select()
      .single();

    if (!error) return NextResponse.json({ player: data }, { status: 201 });
    if (!error.message.includes("player_code")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // else: code collision, loop and retry with a new code
  }

  return NextResponse.json({ error: "تعذر إنشاء كود فريد للاعب، حاول تاني" }, { status: 500 });
}
