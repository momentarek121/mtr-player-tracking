"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCoachAuth } from "@/lib/useCoachAuth";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

export default function TakeAttendancePage() {
  const { loading: authLoading, coach, denied } = useCoachAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [existingRecordIds, setExistingRecordIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sportFilter, setSportFilter] = useState("ALL");

  const loadForDate = async (d: string) => {
    setLoading(true);
    const [{ data: ps }, { data: att }] = await Promise.all([
      supabase.from("players").select("*").eq("approval_status", "APPROVED").eq("active", true).order("name"),
      supabase.from("player_attendance").select("*").eq("date", d),
    ]);
    setPlayers(ps || []);
    const presentSet = new Set((att || []).map((a: any) => a.player_id));
    const idMap: Record<string, string> = {};
    (att || []).forEach((a: any) => { idMap[a.player_id] = a.id; });
    setPresent(presentSet);
    setExistingRecordIds(idMap);
    setLoading(false);
  };

  useEffect(() => { if (coach) loadForDate(date); }, [coach, date]);

  const dayOfWeek = WEEKDAYS[new Date(date + "T12:00:00").getDay()];

  const toggle = async (playerId: string) => {
    if (present.has(playerId)) {
      const recordId = existingRecordIds[playerId];
      if (recordId) await supabase.from("player_attendance").delete().eq("id", recordId);
      setPresent((prev) => { const n = new Set(prev); n.delete(playerId); return n; });
    } else {
      const { data } = await supabase
        .from("player_attendance")
        .insert({ player_id: playerId, date, day_of_week: dayOfWeek, marked_by: "COACH" })
        .select().single();
      if (data) {
        setPresent((prev) => new Set(prev).add(playerId));
        setExistingRecordIds((prev) => ({ ...prev, [playerId]: data.id }));
      }
    }
  };

  const filteredPlayers = useMemo(
    () => players.filter((p) => sportFilter === "ALL" || p.sport === sportFilter || p.sport === "BOTH"),
    [players, sportFilter]
  );

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحقق...</div>;
  if (denied) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">مفيش صلاحية وصول.</div>;

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">أخذ الحضور</div>
            <div className="text-[11px] text-neutral-500">{dayOfWeek} · {date}</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع
        </Link>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-1.5">
          {["ALL", "BJJ", "MMA"].map((s) => (
            <button key={s} onClick={() => setSportFilter(s)} className={`px-3 py-1.5 rounded-md text-xs border ${sportFilter === s ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>
              {s === "ALL" ? "الكل" : s}
            </button>
          ))}
        </div>
        <div className="mr-auto text-xs text-neutral-500">
          {present.size} / {filteredPlayers.length} حاضر
        </div>
      </div>

      {loading ? (
        <div className="text-center text-neutral-500 text-sm py-10">جاري التحميل...</div>
      ) : (
        <div className="space-y-1.5">
          {filteredPlayers.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer border transition ${
                present.has(p.id) ? "bg-mtrred/10 border-mtrred/40" : "bg-neutral-950 border-neutral-800"
              }`}
            >
              <input
                type="checkbox"
                checked={present.has(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-mtrred w-5 h-5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-neutral-500">{p.player_code} · {p.sport} · حزام {BELT_LABELS[p.current_belt]}</div>
              </div>
            </label>
          ))}
          {filteredPlayers.length === 0 && (
            <div className="text-neutral-500 text-xs text-center py-10">مفيش لاعبين مطابقين.</div>
          )}
        </div>
      )}
    </div>
  );
}
