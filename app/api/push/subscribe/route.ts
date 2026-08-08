import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { playerId, endpoint, keys } = await req.json();
  if (!playerId || !endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { player_id: playerId, endpoint, keys_p256dh: keys.p256dh, keys_auth: keys.auth },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
