"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const DOMAINS: Record<string, { label: string; color: string }> = {
  TECHNICAL: { label: "فني", color: "#C8102E" },
  TACTICAL: { label: "تكتيكي", color: "#D4A72C" },
  PHYSICAL: { label: "بدني", color: "#4A9B8E" },
  MENTAL: { label: "ذهني", color: "#8B7FD4" },
};

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

export default function Page() {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [skillCategories, setSkillCategories] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [tab, setTab] = useState<"overview" | "assess" | "roadmap">("overview");
  const [loading, setLoading] = useState(true);

  const loadPlayers = async () => {
    const res = await fetch("/api/players");
    const json = await res.json();
    setPlayers(json.players || []);
    if (!selectedId && json.players?.length) setSelectedId(json.players[0].id);
  };

  const loadSkillCategories = async () => {
    const res = await fetch("/api/skill-categories");
    const json = await res.json();
    setSkillCategories(json.skillCategories || []);
  };

  const loadPlayerData = async (playerId: string) => {
    const [a, r] = await Promise.all([
      fetch(`/api/players/${playerId}/analytics`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/roadmap`).then((r) => r.json()),
    ]);
    setAnalytics(a);
    setRoadmap(r.roadmap || []);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadPlayers(), loadSkillCategories()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedId) loadPlayerData(selectedId);
  }, [selectedId]);

  const addPlayer = async (player: any) => {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });
    const json = await res.json();
    await loadPlayers();
    if (json.player) setSelectedId(json.player.id);
    setShowAddPlayer(false);
  };

  const addAssessment = async (skillCategoryId: string, score: number, date: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillCategoryId, score, date }),
    });
    await loadPlayerData(selectedId);
  };

  const selectedPlayer = players.find((p) => p.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 border-l border-neutral-800 p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">
            MTR
          </div>
          <div>
            <div className="text-sm font-semibold">نظام تتبع اللاعبين</div>
            <div className="text-[11px] text-neutral-500">متصل بـ Supabase</div>
          </div>
        </div>

        <button
          onClick={() => setShowAddPlayer(true)}
          className="mb-4 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
        >
          + إضافة لاعب
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {players.length === 0 && (
            <div className="text-neutral-500 text-xs text-center py-6 leading-relaxed">
              مفيش لاعبين لسه — ابدأ بإضافة أول لاعب.
            </div>
          )}
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedId(p.id); setTab("overview"); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition ${
                p.id === selectedId ? "bg-neutral-900 border border-neutral-700" : "border border-transparent hover:bg-neutral-900/50"
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-neutral-500">{p.sport} · حزام {BELT_LABELS[p.current_belt]}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!selectedPlayer ? (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-3 text-center">
            <div className="text-lg font-semibold">ابدأ بإضافة لاعب</div>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="mt-2 bg-mtrred rounded-lg px-5 py-2.5 text-sm font-semibold"
            >
              + إضافة أول لاعب
            </button>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div>
                <div className="text-2xl font-semibold">{selectedPlayer.name}</div>
                <div className="text-neutral-400 text-sm mt-1">
                  {selectedPlayer.sport} · حزام {BELT_LABELS[selectedPlayer.current_belt]} · {selectedPlayer.weight_kg} كجم
                </div>
              </div>
              {roadmap.length > 0 && (
                <div className="mr-auto bg-mtrred/15 border border-mtrred/40 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {roadmap.length} نقطة تطوير مفتوحة
                </div>
              )}
            </div>

            <div className="flex gap-6 border-b border-neutral-800 mb-6">
              {[["overview", "نظرة عامة"], ["assess", "تسجيل تقييم"], ["roadmap", "خطة التطوير"]].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k as any)}
                  className={`pb-2.5 text-sm font-medium border-b-2 ${
                    tab === k ? "text-white border-mtrred" : "text-neutral-500 border-transparent"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {tab === "overview" && <OverviewTab analytics={analytics} />}
            {tab === "assess" && (
              <AssessTab
                skillCategories={skillCategories.filter(
                  (s) => s.sport === "BOTH" || s.sport === selectedPlayer.sport || selectedPlayer.sport === "BOTH"
                )}
                onAdd={addAssessment}
              />
            )}
            {tab === "roadmap" && <RoadmapTab roadmap={roadmap} />}
          </div>
        )}
      </main>

      {showAddPlayer && (
        <AddPlayerModal onClose={() => setShowAddPlayer(false)} onSave={addPlayer} />
      )}
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: any }) {
  if (!analytics) return null;
  const trend = analytics.progressTrend || [];

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-3">تطور المستوى عبر الوقت</div>
        {trend.length < 2 ? (
          <div className="text-neutral-500 text-xs text-center py-10">
            سجّل تقييمات في أكتر من تاريخ عشان يظهر منحنى التطور
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid stroke="#1E1E21" />
              <XAxis dataKey="month" tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#17171A", border: "1px solid #2A2A2E", fontSize: 12 }} />
              <Legend formatter={(v) => DOMAINS[v]?.label || v} wrapperStyle={{ fontSize: 12 }} />
              {Object.keys(DOMAINS).map((d) => (
                <Line key={d} type="monotone" dataKey={d} stroke={DOMAINS[d].color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-3">الحضور</div>
        <div className="flex gap-3 text-xs text-neutral-400">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
            آخر 30 يوم: <b className="text-white">{analytics.attendance.last30Days.rate}%</b>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
            آخر 90 يوم: <b className="text-white">{analytics.attendance.last90Days.rate}%</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessTab({ skillCategories, onAdd }: { skillCategories: any[]; onAdd: (id: string, score: number, date: string) => void }) {
  const [skillId, setSkillId] = useState(skillCategories[0]?.id || "");
  const [score, setScore] = useState(7);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    skillCategories.forEach((s) => {
      if (!g[s.domain]) g[s.domain] = [];
      g[s.domain].push(s);
    });
    return g;
  }, [skillCategories]);

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 max-w-md">
      <div className="text-sm font-semibold text-neutral-300 mb-4">تسجيل تقييم مهارة</div>

      <label className="block text-xs text-neutral-400 mb-1.5">المهارة</label>
      <select
        value={skillId}
        onChange={(e) => setSkillId(e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-4"
      >
        {Object.entries(grouped).map(([domain, skills]) => (
          <optgroup key={domain} label={DOMAINS[domain]?.label || domain}>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <label className="block text-xs text-neutral-400 mb-1.5">الدرجة: {score} / 10</label>
      <input
        type="range" min={1} max={10} value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        className="w-full mb-4 accent-mtrred"
      />

      <label className="block text-xs text-neutral-400 mb-1.5">التاريخ</label>
      <input
        type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-5"
      />

      <button
        onClick={() => onAdd(skillId, score, date)}
        className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold"
      >
        حفظ التقييم
      </button>
    </div>
  );
}

function RoadmapTab({ roadmap }: { roadmap: any[] }) {
  if (roadmap.length === 0) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
        مفيش نقاط ضعف مسجّلة دلوقتي.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {roadmap.map((item) => (
        <div key={item.id} className="flex gap-3 bg-neutral-950 border border-neutral-800 rounded-xl p-4">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.priority === 1 ? "bg-mtrred" : "bg-mtrgold"}`} />
          <div>
            <div className="text-sm font-semibold mb-1">{item.title}</div>
            <div className="text-xs text-neutral-400 leading-relaxed">{item.recommendation}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddPlayerModal({ onClose, onSave }: { onClose: () => void; onSave: (p: any) => void }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("BJJ");
  const [belt, setBelt] = useState("WHITE");
  const [weight, setWeight] = useState("");
  const [dob, setDob] = useState("2000-01-01");

  const canSave = name.trim() && weight;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-950 border border-neutral-700 rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-4">لاعب جديد</div>

        <label className="block text-xs text-neutral-400 mb-1.5">الاسم</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-3" />

        <label className="block text-xs text-neutral-400 mb-1.5">تاريخ الميلاد</label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-3" />

        <label className="block text-xs text-neutral-400 mb-1.5">الرياضة</label>
        <div className="flex gap-1.5 mb-3">
          {["BJJ", "MMA", "BOTH"].map((s) => (
            <button key={s} onClick={() => setSport(s)} className={`px-3 py-1.5 rounded-md text-xs border ${sport === s ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{s}</button>
          ))}
        </div>

        <label className="block text-xs text-neutral-400 mb-1.5">الحزام</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(BELT_LABELS).map(([b, label]) => (
            <button key={b} onClick={() => setBelt(b)} className={`px-3 py-1.5 rounded-md text-xs border ${belt === b ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{label}</button>
          ))}
        </div>

        <label className="block text-xs text-neutral-400 mb-1.5">الوزن (كجم)</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-5" />

        <button
          disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), dob, sport, currentBelt: belt, weightKg: Number(weight) })}
          className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          حفظ اللاعب
        </button>
      </div>
    </div>
  );
}
