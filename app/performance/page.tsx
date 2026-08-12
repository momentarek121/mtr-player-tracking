"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCoachAuth } from "@/lib/useCoachAuth";

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

export default function PerformancePage() {
  const { loading: authLoading, coach, denied } = useCoachAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [physicalSkills, setPhysicalSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);
  const [formSkillId, setFormSkillId] = useState("");
  const [formScore, setFormScore] = useState(7);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: ps }, { data: a }, { data: sk }] = await Promise.all([
      supabase.from("players").select("*").eq("approval_status", "APPROVED").eq("active", true).order("name"),
      supabase
        .from("skill_assessments")
        .select("player_id, score, date, skill_categories(name, domain)")
        .order("date", { ascending: false }),
      supabase.from("skill_categories").select("*").eq("domain", "PHYSICAL"),
    ]);
    setPlayers(ps || []);
    setAssessments((a || []).filter((x: any) => x.skill_categories?.domain === "PHYSICAL"));
    setPhysicalSkills(sk || []);
    setLoading(false);
  };

  useEffect(() => { if (coach) load(); }, [coach]);

  const submitAssessment = async (playerId: string) => {
    if (!formSkillId) return;
    setSaving(true);
    await supabase.from("skill_assessments").insert({ player_id: playerId, skill_category_id: formSkillId, score: formScore });
    setOpenFormFor(null);
    setFormSkillId("");
    setFormScore(7);
    setSaving(false);
    await load();
  };

  const rows = useMemo(() => {
    return players.map((p) => {
      const playerAssessments = assessments.filter((a: any) => a.player_id === p.id);
      const latestPerSkill = new Map<string, { score: number; name: string; date: string }>();
      playerAssessments.forEach((a: any) => {
        const name = a.skill_categories?.name;
        if (!name || latestPerSkill.has(name)) return;
        latestPerSkill.set(name, { score: a.score, name, date: a.date });
      });
      const scores = Array.from(latestPerSkill.values());
      const avg = scores.length ? scores.reduce((s, v) => s + v.score, 0) / scores.length : null;
      return { player: p, scores, avg };
    }).sort((a, b) => (a.avg ?? -1) - (b.avg ?? -1)); // weakest first, so coach sees who needs attention
  }, [players, assessments]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحقق...</div>;
  if (denied) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">مفيش صلاحية وصول.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">الأداء البدني</div>
            <div className="text-[11px] text-neutral-500">لياقة، قوة، مرونة — كل اللاعبين في مكان واحد</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع
        </Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/admin-login"; }}
          className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition"
        >
          🚪 خروج
        </button>
      </div>

      <div className="space-y-2">
        {rows.map(({ player, scores, avg }) => (
          <div key={player.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold">{player.name}</div>
                <div className="text-[11px] text-neutral-500">{player.player_code} · {player.sport} · حزام {BELT_LABELS[player.current_belt]}</div>
              </div>
              {avg !== null ? (
                <div className={`text-lg font-bold ${avg < 5 ? "text-red-400" : avg < 7 ? "text-yellow-400" : "text-green-400"}`}>
                  {avg.toFixed(1)}<span className="text-xs text-neutral-500">/10</span>
                </div>
              ) : (
                <div className="text-xs text-neutral-600">مفيش تقييم بدني</div>
              )}
            </div>
            {scores.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {scores.map((s, i) => (
                  <span key={i} className="text-[11px] bg-neutral-900 border border-neutral-800 rounded-full px-2.5 py-1">
                    {s.name}: {s.score}/10
                  </span>
                ))}
              </div>
            )}

            {openFormFor === player.id ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mt-2 space-y-2">
                <select
                  value={formSkillId}
                  onChange={(e) => setFormSkillId(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">اختار المهارة البدنية</option>
                  {physicalSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div>
                  <label className="text-xs text-neutral-500">الدرجة: {formScore}/10</label>
                  <input type="range" min={1} max={10} value={formScore} onChange={(e) => setFormScore(Number(e.target.value))} className="w-full accent-mtrred" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => submitAssessment(player.id)} disabled={saving || !formSkillId} className="bg-mtrred rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                    {saving ? "..." : "حفظ"}
                  </button>
                  <button onClick={() => setOpenFormFor(null)} className="text-xs text-neutral-500">إلغاء</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setOpenFormFor(player.id)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition"
              >
                + تسجيل تقييم بدني
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-neutral-500 text-xs text-center py-10">مفيش لاعبين مسجّلين لسه.</div>}
      </div>
    </div>
  );
}
