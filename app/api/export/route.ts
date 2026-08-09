import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

function csvEscape(v: any) {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/export — CSV export of all players + latest subscription status
export async function GET() {
  const [{ data: players }, { data: subs }] = await Promise.all([
    supabase.from("players").select("*").order("name"),
    supabase.from("player_subscriptions").select("*").order("end_date", { ascending: false }),
  ]);

  const latestSubByPlayer = new Map<string, any>();
  (subs || []).forEach((s: any) => {
    if (!latestSubByPlayer.has(s.player_id)) latestSubByPlayer.set(s.player_id, s);
  });

  const headers = ["الاسم", "الكود", "الرياضة", "الحزام", "الوزن", "الحالة", "الاشتراك الحالي", "تاريخ الانتهاء", "تاريخ الانضمام"];
  const rows = (players || []).map((p: any) => {
    const sub = latestSubByPlayer.get(p.id);
    return [
      p.name,
      p.player_code,
      p.sport,
      BELT_LABELS[p.current_belt] || p.current_belt,
      p.weight_kg,
      p.approval_status === "APPROVED" ? "معتمد" : "بانتظار الموافقة",
      sub?.plan_name || "",
      sub?.end_date || "",
      p.join_date,
    ];
  });

  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mtr-players-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
