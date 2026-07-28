"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";

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
  const [notes, setNotes] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [tab, setTab] = useState<
    "overview" | "assess" | "roadmap" | "curriculum" | "notes" | "files" | "assistant" | "schedule" | "nutrition" | "exercises" | "requests"
  >("overview");
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
    const [a, r, n, f, s, c, sch, mls, exs, fb] = await Promise.all([
      fetch(`/api/players/${playerId}/analytics`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/roadmap`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/notes`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/attachments`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/assessments`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/curriculum`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/schedule`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/nutrition`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/exercises`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/feedback`).then((r) => r.json()),
    ]);
    setAnalytics(a);
    setRoadmap(r.roadmap || []);
    setNotes(n.notes || []);
    setAttachments(f.attachments || []);
    setAssessments(s.assessments || []);
    setCurriculum(c);
    setSchedule(sch.schedule || []);
    setMeals(mls.meals || []);
    setExercises(exs.exercises || []);
    setFeedback(fb.feedback || []);
  };

  const addScheduleItem = async (dayOfWeek: string, timeLabel: string, activity: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/schedule`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, timeLabel, activity }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteScheduleItem = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/schedule?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addMeal = async (mealTime: string, title: string, description: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/nutrition`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealTime, title, description }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteMeal = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/nutrition?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addExercise = async (title: string, description: string, dueDate: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/exercises`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate }),
    });
    await loadPlayerData(selectedId);
  };
  const toggleExercise = async (itemId: string, completed: boolean) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/exercises`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, completed }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteExercise = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/exercises?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const replyFeedback = async (itemId: string, status: string, coachReply?: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/feedback`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status, coachReply }),
    });
    await loadPlayerData(selectedId);
  };

  const addCurriculumItem = async (title: string) => {
    if (!selectedPlayerBelt) return;
    await fetch("/api/curriculum-items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ belt: selectedPlayerBelt, title }),
    });
    if (selectedId) await loadPlayerData(selectedId);
  };
  const deleteCurriculumItem = async (itemId: string) => {
    await fetch(`/api/curriculum-items/${itemId}`, { method: "DELETE" });
    if (selectedId) await loadPlayerData(selectedId);
  };

  const toggleCurriculumItem = async (curriculumItemId: string, completed: boolean) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/curriculum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculumItemId, completed }),
    });
    await loadPlayerData(selectedId);
  };

  const addNote = async (content: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await loadPlayerData(selectedId);
  };

  const uploadFile = async (file: File) => {
    if (!selectedId) return;
    const path = `${selectedId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("player-attachments").upload(path, file);
    if (upErr) { alert("فشل الرفع: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("player-attachments").getPublicUrl(path);
    await fetch(`/api/players/${selectedId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileUrl: pub.publicUrl, fileType: file.type }),
    });
    await loadPlayerData(selectedId);
  };

  const uploadAvatar = async (file: File) => {
    if (!selectedId) return;
    const path = `${selectedId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("player-photos").upload(path, file);
    if (upErr) { alert("فشل الرفع: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("player-photos").getPublicUrl(path);
    await supabase.from("players").update({ photo_url: pub.publicUrl }).eq("id", selectedId);
    await loadPlayers();
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

  const editPlayer = async (player: any) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });
    await loadPlayers();
    setShowEditPlayer(false);
  };

  const deletePlayer = async () => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    setShowEditPlayer(false);
    await loadPlayers();
  };

  const addSkillCategory = async (payload: { name: string; domain: string; sport: string }) => {
    await fetch("/api/skill-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadSkillCategories();
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
  const selectedPlayerBelt = selectedPlayer?.current_belt;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-l border-neutral-800 p-4 flex flex-col shrink-0 max-h-[45vh] md:max-h-none">
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
          className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
        >
          + إضافة لاعب
        </button>

        <Link
          href="/team"
          className="mb-4 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
        >
          📊 لوحة الفريق
        </Link>

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

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
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
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6">
              <label className="relative w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center text-[10px] text-neutral-500 text-center">
                {selectedPlayer.photo_url ? (
                  <img src={selectedPlayer.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  "صورة"
                )}
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </label>
              <div>
                <div className="text-xl md:text-2xl font-semibold">{selectedPlayer.name}</div>
                <div className="text-neutral-400 text-sm mt-1">
                  {selectedPlayer.sport} · حزام {BELT_LABELS[selectedPlayer.current_belt]} · {selectedPlayer.weight_kg} كجم
                </div>
              </div>
              {roadmap.length > 0 && (
                <div className="bg-mtrred/15 border border-mtrred/40 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {roadmap.length} نقطة تطوير مفتوحة
                </div>
              )}
              <button
                onClick={() => setShowEditPlayer(true)}
                className="md:mr-auto bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-500 transition"
              >
                ✏️ تعديل البيانات
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/player/${selectedPlayer.id}`;
                  navigator.clipboard.writeText(url);
                  alert("اتنسخ لينك اللاعب:\n" + url);
                }}
                className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full hover:border-neutral-500 transition"
              >
                نسخ لينك اللاعب 🔗
              </button>
            </div>

            <div className="flex gap-4 md:gap-6 border-b border-neutral-800 mb-6 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ["overview", "نظرة عامة"],
                ["assess", "تسجيل تقييم"],
                ["roadmap", "خطة التطوير"],
                ["curriculum", "متطلبات الحزام"],
                ["schedule", "الجدول"],
                ["nutrition", "التغذية"],
                ["exercises", "تمارين"],
                ["requests", "طلبات اللاعب"],
                ["notes", "ملاحظات"],
                ["files", "ملفات وصور"],
                ["assistant", "المساعد"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k as any)}
                  className={`pb-2.5 text-sm font-medium border-b-2 shrink-0 ${
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
                onAddSkillCategory={addSkillCategory}
              />
            )}
            {tab === "roadmap" && <RoadmapTab roadmap={roadmap} />}
            {tab === "curriculum" && (
              <CurriculumTab
                curriculum={curriculum}
                onToggle={toggleCurriculumItem}
                onAddItem={addCurriculumItem}
                onDeleteItem={deleteCurriculumItem}
                belt={selectedPlayer.current_belt}
              />
            )}
            {tab === "schedule" && <ScheduleTab schedule={schedule} onAdd={addScheduleItem} onDelete={deleteScheduleItem} />}
            {tab === "nutrition" && <NutritionTab meals={meals} onAdd={addMeal} onDelete={deleteMeal} />}
            {tab === "exercises" && (
              <ExercisesTab exercises={exercises} onAdd={addExercise} onToggle={toggleExercise} onDelete={deleteExercise} />
            )}
            {tab === "requests" && <RequestsTab feedback={feedback} onReply={replyFeedback} />}
            {tab === "notes" && <NotesTab notes={notes} onAdd={addNote} />}
            {tab === "files" && <AttachmentsTab attachments={attachments} onUpload={uploadFile} />}
            {tab === "assistant" && (
              <AssistantTab player={selectedPlayer} assessments={assessments} roadmap={roadmap} skillCategories={skillCategories} />
            )}
          </div>
        )}
      </main>

      {showAddPlayer && (
        <AddPlayerModal onClose={() => setShowAddPlayer(false)} onSave={addPlayer} />
      )}
      {showEditPlayer && selectedPlayer && (
        <AddPlayerModal
          onClose={() => setShowEditPlayer(false)}
          onSave={editPlayer}
          initial={selectedPlayer}
          onDelete={deletePlayer}
        />
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

function AssessTab({
  skillCategories, onAdd, onAddSkillCategory,
}: {
  skillCategories: any[];
  onAdd: (id: string, score: number, date: string) => void;
  onAddSkillCategory: (payload: { name: string; domain: string; sport: string }) => Promise<void>;
}) {
  const [skillId, setSkillId] = useState(skillCategories[0]?.id || "");
  const [score, setScore] = useState(7);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDomain, setNewSkillDomain] = useState("TECHNICAL");

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    skillCategories.forEach((s) => {
      if (!g[s.domain]) g[s.domain] = [];
      g[s.domain].push(s);
    });
    return g;
  }, [skillCategories]);

  const submitNewSkill = async () => {
    if (!newSkillName.trim()) return;
    await onAddSkillCategory({ name: newSkillName.trim(), domain: newSkillDomain, sport: "BOTH" });
    setNewSkillName("");
    setShowNewSkill(false);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 max-w-md">
      <div className="text-sm font-semibold text-neutral-300 mb-4">تسجيل تقييم مهارة</div>

      <label className="block text-xs text-neutral-400 mb-1.5">المهارة</label>
      <select
        value={skillId}
        onChange={(e) => setSkillId(e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-2"
      >
        {Object.entries(grouped).map(([domain, skills]) => (
          <optgroup key={domain} label={DOMAINS[domain]?.label || domain}>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {!showNewSkill ? (
        <button
          onClick={() => setShowNewSkill(true)}
          className="text-xs text-neutral-400 hover:text-neutral-200 transition mb-4"
        >
          + مهارة أو تكنيك مش موجود في القايمة؟ ضيفه هنا
        </button>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-4 space-y-2">
          <input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="اسم المهارة أو التكنيك (أي فكرة)"
            className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(DOMAINS).map(([key, d]) => (
              <button
                key={key}
                onClick={() => setNewSkillDomain(key)}
                className={`px-2.5 py-1 rounded-md text-[11px] border ${newSkillDomain === key ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={submitNewSkill} className="flex-1 bg-mtrred rounded-lg py-2 text-xs font-semibold">
              إضافة المهارة
            </button>
            <button onClick={() => setShowNewSkill(false)} className="text-xs text-neutral-500 px-3">
              إلغاء
            </button>
          </div>
        </div>
      )}

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

function NotesTab({ notes, onAdd }: { notes: any[]; onAdd: (content: string) => void }) {
  const [content, setContent] = useState("");

  const submit = () => {
    if (!content.trim()) return;
    onAdd(content.trim());
    setContent("");
  };

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-3">ملاحظة جديدة</div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب ملاحظة عن اللاعب (سلوك، إصابة، أداء في السبارينج...)"
          rows={3}
          className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-3 resize-none"
        />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">
          حفظ الملاحظة
        </button>
      </div>

      <div className="space-y-2.5">
        {notes.length === 0 && (
          <div className="text-neutral-500 text-xs text-center py-8">مفيش ملاحظات مسجّلة لسه.</div>
        )}
        {notes.map((n) => (
          <div key={n.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="text-sm text-neutral-200 leading-relaxed mb-2">{n.content}</div>
            <div className="text-[11px] text-neutral-500">
              {new Date(n.created_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentsTab({ attachments, onUpload }: { attachments: any[]; onUpload: (f: File) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    await onUpload(file);
    setUploading(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-3">رفع ملف أو صورة</div>
        <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-700 rounded-lg py-6 text-sm text-neutral-400 cursor-pointer hover:border-neutral-500 transition">
          {uploading ? "جاري الرفع..." : "دوس هنا أو اسحب ملف (صور، فيديو، PDF)"}
          <input
            type="file" className="hidden" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {attachments.length === 0 && (
          <div className="col-span-2 text-neutral-500 text-xs text-center py-8">مفيش ملفات مرفوعة لسه.</div>
        )}
        {attachments.map((a) => (
          <a
            key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
            className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 hover:border-neutral-600 transition"
          >
            {a.file_type?.startsWith("image/") ? (
              <img src={a.file_url} alt={a.file_name} className="w-full h-28 object-cover rounded-lg mb-2" />
            ) : (
              <div className="w-full h-28 bg-neutral-900 rounded-lg mb-2 flex items-center justify-center text-neutral-500 text-xs">
                ملف
              </div>
            )}
            <div className="text-xs text-neutral-300 truncate">{a.file_name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Rule-based "assistant" — no external AI cost. Reads the player's own
// data (roadmap + latest domain scores) and writes a plain-language
// summary + focus plan. Swap this for a real Claude-powered chat later
// by calling a server route that has ANTHROPIC_API_KEY set.
function AssistantTab({ player, assessments, roadmap, skillCategories }: any) {
  const summary = useMemo(() => {
    const latestPerSkill = new Map<string, number>();
    [...assessments].sort((a: any, b: any) => (a.date < b.date ? -1 : 1)).forEach((a: any) => {
      latestPerSkill.set(a.skill_category_id, a.score);
    });

    const domainScores: Record<string, number[]> = {};
    skillCategories.forEach((s: any) => {
      const score = latestPerSkill.get(s.id);
      if (score === undefined) return;
      if (!domainScores[s.domain]) domainScores[s.domain] = [];
      domainScores[s.domain].push(score);
    });

    const domainAverages = Object.entries(domainScores).map(([domain, scores]) => ({
      domain,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));

    if (domainAverages.length === 0) return null;

    const strongest = domainAverages.reduce((a, b) => (a.avg > b.avg ? a : b));
    const weakest = domainAverages.reduce((a, b) => (a.avg < b.avg ? a : b));
    const topPriority = [...roadmap].sort((a: any, b: any) => a.priority - b.priority)[0];

    return { strongest, weakest, topPriority, totalOpen: roadmap.length };
  }, [assessments, roadmap, skillCategories]);

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 max-w-lg">
      <div className="text-sm font-semibold text-neutral-300 mb-4">ملخص المدرب الآلي</div>

      {!summary ? (
        <div className="text-neutral-500 text-xs text-center py-8">
          سجّل تقييمات للاعب الأول عشان يظهر التحليل.
        </div>
      ) : (
        <div className="space-y-3 text-sm text-neutral-200 leading-relaxed">
          <p>
            <b>{player.name}</b> أقوى نقطة عنده حاليًا في محور{" "}
            <span style={{ color: DOMAINS[summary.strongest.domain]?.color }}>
              {DOMAINS[summary.strongest.domain]?.label}
            </span>{" "}
            (متوسط {summary.strongest.avg.toFixed(1)}/10)، بينما أضعف محور هو{" "}
            <span style={{ color: DOMAINS[summary.weakest.domain]?.color }}>
              {DOMAINS[summary.weakest.domain]?.label}
            </span>{" "}
            (متوسط {summary.weakest.avg.toFixed(1)}/10).
          </p>

          {summary.totalOpen > 0 ? (
            <p>
              فيه <b>{summary.totalOpen}</b> نقطة تطوير مفتوحة. الأولوية القصوى دلوقتي:{" "}
              <b>{summary.topPriority?.title}</b> — {summary.topPriority?.recommendation}
            </p>
          ) : (
            <p>مفيش نقاط ضعف واضحة مسجّلة حاليًا — استمر على نفس الوتيرة وسجّل تقييمات دورية.</p>
          )}
        </div>
      )}
    </div>
  );
}

const WEEKDAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

function ScheduleTab({ schedule, onAdd, onDelete }: { schedule: any[]; onAdd: (d: string, t: string, a: string) => void; onDelete: (id: string) => void }) {
  const [day, setDay] = useState(WEEKDAYS[0]);
  const [time, setTime] = useState("");
  const [activity, setActivity] = useState("");

  const submit = () => {
    if (!activity.trim()) return;
    onAdd(day, time, activity.trim());
    setActivity(""); setTime("");
  };

  const byDay = useMemo(() => {
    const g: Record<string, any[]> = {};
    schedule.forEach((s) => { if (!g[s.day_of_week]) g[s.day_of_week] = []; g[s.day_of_week].push(s); });
    return g;
  }, [schedule]);

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <div className="flex gap-2 flex-wrap">
          {WEEKDAYS.map((d) => (
            <button key={d} onClick={() => setDay(d)} className={`px-2.5 py-1 rounded-md text-xs border ${day === d ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{d}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="الساعة (مثلاً 6 م)" className="w-28 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="النشاط (مثلاً حصة سبارينج)" className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          <button onClick={submit} className="bg-mtrred rounded-lg px-4 text-sm font-semibold shrink-0">إضافة</button>
        </div>
      </div>

      {WEEKDAYS.filter((d) => byDay[d]?.length).map((d) => (
        <div key={d} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-neutral-400 mb-2">{d}</div>
          <div className="space-y-1.5">
            {byDay[d].map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-neutral-900 rounded-lg px-3 py-2">
                <div className="text-sm">{item.time_label && <span className="text-neutral-500 ml-2">{item.time_label}</span>}{item.activity}</div>
                <button onClick={() => onDelete(item.id)} className="text-neutral-600 hover:text-red-400 text-xs">حذف</button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {schedule.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش جدول مسجّل لسه.</div>}
    </div>
  );
}

function NutritionTab({ meals, onAdd, onDelete }: { meals: any[]; onAdd: (mt: string, t: string, d: string) => void; onDelete: (id: string) => void }) {
  const [mealTime, setMealTime] = useState("الفطار");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd(mealTime, title.trim(), description.trim());
    setTitle(""); setDescription("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {["الفطار", "قبل التمرين", "بعد التمرين", "الغدا", "العشا", "سناك"].map((m) => (
            <button key={m} onClick={() => setMealTime(m)} className={`px-2.5 py-1 rounded-md text-xs border ${mealTime === m ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{m}</button>
          ))}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الوجبة" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل (المكونات، الكمية...)" rows={2} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none" />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">إضافة وجبة</button>
      </div>

      <div className="space-y-2">
        {meals.map((m: any) => (
          <div key={m.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-mtrgold font-medium">{m.meal_time}</div>
              <button onClick={() => onDelete(m.id)} className="text-neutral-600 hover:text-red-400 text-xs">حذف</button>
            </div>
            <div className="text-sm font-medium">{m.title}</div>
            {m.description && <div className="text-xs text-neutral-500 mt-1">{m.description}</div>}
          </div>
        ))}
        {meals.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش خطة غذائية مسجّلة لسه.</div>}
      </div>
    </div>
  );
}

function ExercisesTab({ exercises, onAdd, onToggle, onDelete }: { exercises: any[]; onAdd: (t: string, d: string, due: string) => void; onToggle: (id: string, c: boolean) => void; onDelete: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim(), dueDate);
    setTitle(""); setDescription(""); setDueDate("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التمرين (مثلاً: 100 تكرار سبرول)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل" rows={2} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none" />
        <div className="flex gap-2">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">تكليف تمرين</button>
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex: any) => (
          <label key={ex.id} className="flex items-start gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={ex.completed} onChange={(e) => onToggle(ex.id, e.target.checked)} className="mt-0.5 accent-mtrred w-4 h-4" />
            <div className="flex-1">
              <div className={`text-sm ${ex.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{ex.title}</div>
              {ex.description && <div className="text-xs text-neutral-500 mt-1">{ex.description}</div>}
              {ex.due_date && <div className="text-[11px] text-neutral-600 mt-1">قبل: {ex.due_date}</div>}
            </div>
            <button onClick={(e) => { e.preventDefault(); onDelete(ex.id); }} className="text-neutral-600 hover:text-red-400 text-xs">حذف</button>
          </label>
        ))}
        {exercises.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش تمارين مكلّف بيها اللاعب لسه.</div>}
      </div>
    </div>
  );
}

function RequestsTab({ feedback, onReply }: { feedback: any[]; onReply: (id: string, status: string, reply?: string) => void }) {
  return (
    <div className="space-y-2.5">
      {feedback.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">اللاعب لسه ما بعتش أي ملاحظات أو طلبات.</div>}
      {feedback.map((f: any) => (
        <div key={f.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${f.status === "PENDING" ? "bg-mtrgold/15 text-yellow-300" : "bg-neutral-800 text-neutral-400"}`}>
              {f.status === "PENDING" ? "بانتظار الرد" : "تمت المراجعة"}
            </span>
            <span className="text-[11px] text-neutral-600">{new Date(f.created_at).toLocaleDateString("ar-EG")}</span>
          </div>
          <div className="text-sm text-neutral-200 mb-3">{f.message}</div>
          {f.status === "PENDING" && (
            <button
              onClick={() => onReply(f.id, "REVIEWED")}
              className="text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 hover:border-neutral-500 transition"
            >
              تعليم كمُراجَع
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function CurriculumTab({
  curriculum, onToggle, onAddItem, onDeleteItem, belt,
}: {
  curriculum: any;
  onToggle: (id: string, completed: boolean) => void;
  onAddItem: (title: string) => void;
  onDeleteItem: (id: string) => void;
  belt: string;
}) {
  const [newTitle, setNewTitle] = useState("");
  if (!curriculum) return null;
  const { items, completedCount, totalCount, readyForPromotion } = curriculum;

  const submit = () => {
    if (!newTitle.trim()) return;
    onAddItem(newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-neutral-300">متطلبات حزام {BELT_LABELS[belt]}</div>
          <div className="text-xs text-neutral-400">{completedCount} / {totalCount}</div>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-mtrred transition-all"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
        {readyForPromotion && (
          <div className="mt-3 bg-mtrgold/15 border border-mtrgold/40 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-lg">
            🎉 اللاعب مستوفي كل متطلبات الحزام ده — جاهز للترقية
          </div>
        )}
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={`ضيف متطلب جديد لحزام ${BELT_LABELS[belt]}`}
          className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold shrink-0">
          إضافة
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-neutral-500 text-xs text-center py-8">مفيش متطلبات مسجّلة للحزام ده لسه — ضيف أول واحد فوق.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 hover:border-neutral-700 transition"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                className="mt-0.5 accent-mtrred w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <div className={`text-sm ${item.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>
                  {item.title}
                </div>
                {item.description && <div className="text-xs text-neutral-500 mt-1">{item.description}</div>}
              </div>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-neutral-600 hover:text-red-400 text-xs transition shrink-0"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPlayerModal({
  onClose, onSave, initial, onDelete,
}: {
  onClose: () => void;
  onSave: (p: any) => void;
  initial?: any;
  onDelete?: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [sport, setSport] = useState(initial?.sport || "BJJ");
  const [belt, setBelt] = useState(initial?.current_belt || "WHITE");
  const [weight, setWeight] = useState(initial?.weight_kg?.toString() || "");
  const [dob, setDob] = useState(initial?.dob || "2000-01-01");

  const canSave = name.trim() && weight;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-neutral-950 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-4">{isEdit ? "تعديل بيانات اللاعب" : "لاعب جديد"}</div>

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
          {isEdit ? "حفظ التعديلات" : "حفظ اللاعب"}
        </button>

        {isEdit && onDelete && (
          <button
            onClick={() => { if (confirm("متأكد إنك عايز تمسح اللاعب ده نهائيًا؟")) onDelete(); }}
            className="w-full mt-2 text-red-400 text-xs py-2 hover:text-red-300 transition"
          >
            حذف اللاعب نهائيًا
          </button>
        )}
      </div>
    </div>
  );
}
