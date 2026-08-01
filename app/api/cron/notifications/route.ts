import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import webpush from "web-push";

// Triggered daily by Vercel Cron (see vercel.json).
// Sends: (1) a nutrition reminder to every player with a saved meal plan,
// (2) a subscription-expiry warning to players whose subscription ends
// within the next 3 days (or has already expired today).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:coach@mtrteam.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const results = { nutritionSent: 0, expirySent: 0, errors: [] as string[] };

  // 1) Nutrition reminders — anyone with at least one saved meal
  const { data: playersWithMeals } = await supabase
    .from("player_meals")
    .select("player_id")
    .limit(1000);
  const uniquePlayerIds = Array.from(new Set((playersWithMeals || []).map((m: any) => m.player_id)));

  for (const playerId of uniquePlayerIds) {
    const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("player_id", playerId);
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
          JSON.stringify({ title: "MTR Team 🍽️", body: "متنساش تتبع نظامك الغذائي النهاردة!", url: "/" })
        );
        results.nutritionSent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          results.errors.push(e.message);
        }
      }
    }
  }

  // 2) Subscription expiry warnings
  const { data: expiring } = await supabase
    .from("player_subscriptions")
    .select("player_id, end_date")
    .gte("end_date", today)
    .lte("end_date", in3Days)
    .eq("status", "ACTIVE");

  for (const sub of expiring || []) {
    const { data: pushSubs } = await supabase.from("push_subscriptions").select("*").eq("player_id", sub.player_id);
    for (const ps of pushSubs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: ps.endpoint, keys: { p256dh: ps.keys_p256dh, auth: ps.keys_auth } },
          JSON.stringify({ title: "MTR Team ⏰", body: `اشتراكك هينتهي يوم ${sub.end_date} — كلم المدرب لو محتاج تجدد.`, url: "/" })
        );
        results.expirySent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", ps.id);
        } else {
          results.errors.push(e.message);
        }
      }
    }
  }

  return NextResponse.json(results);
}
