"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useCoachAuth } from "@/lib/useCoachAuth";

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
  const { loading: authLoading, coach, denied } = useCoachAuth();
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
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [playerChatLogs, setPlayerChatLogs] = useState<any[]>([]);
  const [weightLog, setWeightLog] = useState<any[]>([]);
  const [rolls, setRolls] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [fightCamps, setFightCamps] = useState<any[]>([]);
  const [fightCampTasks, setFightCampTasks] = useState<any[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [tab, setTab] = useState<
    "overview" | "assess" | "roadmap" | "curriculum" | "notes" | "files" | "assistant" | "schedule" | "nutrition" | "exercises" | "requests" | "subscription" | "attendance" | "goals" | "playerchat" | "weight" | "rolls" | "readiness" | "competitions" | "fightcamp"
  >("overview");
  const [loading, setLoading] = useState(true);

  const loadPlayers = async () => {
    const res = await fetch("/api/players?approvalStatus=APPROVED");
    const json = await res.json();
    setPlayers(json.players || []);
    if (!selectedId && json.players?.length) setSelectedId(json.players[0].id);
  };

  const loadPendingCount = async () => {
    const res = await fetch("/api/players?approvalStatus=PENDING");
    const json = await res.json();
    setPendingCount((json.players || []).length);
  };

  const loadSkillCategories = async () => {
    const res = await fetch("/api/skill-categories");
    const json = await res.json();
    setSkillCategories(json.skillCategories || []);
  };

  const loadPlayerData = async (playerId: string) => {
    const [a, r, n, f, s, c, sch, mls, exs, fb, subs, att, gls, chatLogs, wl, rls, rdn, comp, compFight] = await Promise.all([
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
      fetch(`/api/players/${playerId}/subscriptions`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/attendance`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/goals`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/chat-logs`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/weight-log`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/rolls`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/readiness`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/competitions`).then((r) => r.json()),
      fetch(`/api/players/${playerId}/fight-camp`).then((r) => r.json()),
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
    setSubscriptions(subs.subscriptions || []);
    setAttendance(att.attendance || []);
    setGoals(gls.goals || []);
    setPlayerChatLogs(chatLogs.logs || []);
    setWeightLog(wl.log || []);
    setRolls(rls.rolls || []);
    setReadiness(rdn.readiness || []);
    setCompetitions(comp.competitions || []);
    setFightCamps(compFight.camps || []);
    setFightCampTasks(compFight.tasks || []);
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

  const replyFeedback = async (itemId: string, status: string, coachReply?: string, imageFile?: File | null) => {
    if (!selectedId) return;
    let coachReplyImageUrl: string | undefined;
    if (imageFile) {
      const path = `${selectedId}/reply-${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("player-attachments").upload(path, imageFile);
      if (upErr) { alert("فشل رفع الصورة: " + upErr.message); return; }
      const { data: pub } = supabase.storage.from("player-attachments").getPublicUrl(path);
      coachReplyImageUrl = pub.publicUrl;
    }
    await fetch(`/api/players/${selectedId}/feedback`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status, coachReply, coachReplyImageUrl }),
    });
    await loadPlayerData(selectedId);
  };

  const addSubscription = async (planName: string, amount: string, startDate: string, endDate: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/subscriptions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planName, amount: amount ? Number(amount) : null, startDate, endDate }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteSubscription = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/subscriptions?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addAttendanceManual = async (date: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/players/${selectedId}/attendance`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, markedBy: "COACH" }),
    });
    const json = await res.json();
    if (json.error) { alert(json.error); return; }
    await loadPlayerData(selectedId);
  };
  const editAttendanceDate = async (itemId: string, date: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/attendance`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, date }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteAttendance = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/attendance?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addGoal = async (title: string, description: string, targetDate: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/goals`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, targetDate }),
    });
    await loadPlayerData(selectedId);
  };
  const toggleGoal = async (itemId: string, status: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/goals`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    });
    await loadPlayerData(selectedId);
  };
  const editGoalDate = async (itemId: string, targetDate: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/goals`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, targetDate }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteGoal = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/goals?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addWeightEntry = async (weightKg: number, date: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/weight-log`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg, date }),
    });
    await loadPlayerData(selectedId);
    await loadPlayers();
  };
  const deleteWeightEntry = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/weight-log?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addRoll = async (partnerName: string, subsLanded: number, subsReceived: number, notes: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/rolls`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerName, submissionsLanded: subsLanded, submissionsReceived: subsReceived, notes }),
    });
    await loadPlayerData(selectedId);
  };
  const deleteRoll = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/rolls?itemId=${itemId}`, { method: "DELETE" });
    await loadPlayerData(selectedId);
  };

  const addCompetition = async (payload: any) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/competitions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadPlayerData(selectedId);
  };
  const deleteCompetition = async (itemId: string) => {
    if (!selectedId) return;
    await fetch(`/api/players/${selectedId}/competitions?itemId=${itemId}`, { method: "DELETE" });
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

  const uploadFile = async (file: File, metadata: { caption?: string; stage?: string; visibility?: string }) => {
    if (!selectedId) return;
    const path = `${selectedId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("player-attachments").upload(path, file);
    if (upErr) { alert("فشل الرفع: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("player-attachments").getPublicUrl(path);
    await fetch(`/api/players/${selectedId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileUrl: pub.publicUrl,
        fileType: file.type,
        caption: metadata.caption,
        stage: metadata.stage,
        visibility: metadata.visibility,
      }),
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
    if (!coach) return;
    if (coach.role === "PERFORMANCE_COACH") {
      window.location.href = "/performance";
      return;
    }
    (async () => {
      await Promise.all([loadPlayers(), loadSkillCategories(), loadPendingCount()]);
      setLoading(false);
    })();
  }, [coach]);

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

  const deleteSelectedPlayers = async () => {
    if (selectedForDelete.size === 0) return;
    if (!confirm(`متأكد إنك عايز تمسح ${selectedForDelete.size} لاعب نهائيًا؟`)) return;
    setDeleting(true);
    await Promise.all(
      Array.from(selectedForDelete).map((id) => fetch(`/api/players/${id}`, { method: "DELETE" }))
    );
    if (selectedId && selectedForDelete.has(selectedId)) setSelectedId(null);
    setSelectedForDelete(new Set());
    setBulkMode(false);
    setDeleting(false);
    await loadPlayers();
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (denied) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-sm text-center">
          <div className="text-lg font-semibold mb-2">🚫 مفيش صلاحية</div>
          <div className="text-sm text-neutral-400 leading-relaxed mb-4">
            الحساب اللي داخل بيه مش مضاف كمدرب في النظام. لو المفروض يكون عندك صلاحية، تواصل مع الأدمن.
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/admin-login"; }}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition"
          >
            تسجيل خروج وتجربة حساب تاني
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-700 text-lg"
        >
          ☰
        </button>
        <div className="text-sm font-semibold truncate">
          {selectedPlayer ? selectedPlayer.name : "نظام تتبع اللاعبين"}
        </div>
        <div className="w-8" />
      </div>

      <aside
        className={`${sidebarOpen ? "flex" : "hidden"} md:flex w-full md:w-72 border-b md:border-b-0 md:border-l border-neutral-800 p-4 flex-col shrink-0 max-h-[70vh] md:max-h-none overflow-y-auto`}
      >
        <div className="hidden md:flex items-center gap-3 mb-6 px-1">
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

        <button
          onClick={() => setMoreMenuOpen((v) => !v)}
          className="md:hidden mb-2 flex items-center justify-center gap-1 text-xs text-neutral-400 py-1.5"
        >
          {moreMenuOpen ? "▲ إخفاء الأدوات" : "▼ المزيد من الأدوات"}
        </button>

        <div className={`${moreMenuOpen ? "flex" : "hidden"} md:flex flex-col shrink-0`}>
          <Link
            href="/team"
            className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
          >
            📊 لوحة الفريق
          </Link>

          <Link
            href="/registrations"
            className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition relative"
          >
            📝 طلبات التسجيل
            {pendingCount > 0 && (
              <span className="bg-mtrred text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => {
              const url = `${window.location.origin}/login`;
              navigator.clipboard.writeText(url);
              alert("اتنسخ لينك تسجيل دخول اللاعبين:\n" + url);
            }}
            className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
          >
            🔑 نسخ لينك تسجيل دخول اللاعبين
          </button>

          <Link
            href="/take-attendance"
            className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
          >
            ✅ أخذ الحضور
          </Link>

          <Link
            href="/performance"
            className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
          >
            💪 الأداء البدني
          </Link>

          {coach?.role === "ADMIN" && (
            <Link
              href="/owner-chat"
              className="mb-2 flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition"
            >
              🧠 شات صاحب النظام
            </Link>
          )}

          <div className="flex gap-2 mb-3">
            <Link
              href="/coaches"
              className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg py-2 text-xs hover:border-neutral-500 transition"
            >
              👥 المدربين
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/admin-login"; }}
              className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg py-2 text-xs hover:border-neutral-500 transition"
            >
              🚪 خروج
            </button>
          </div>
        </div>

        <input
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          placeholder="دور بالاسم أو الكود..."
          className="mt-1 mb-2 w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm shrink-0"
        />

        <div className="flex items-center justify-between mb-2 shrink-0">
          <button
            onClick={() => { setBulkMode((v) => !v); setSelectedForDelete(new Set()); }}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition"
          >
            {bulkMode ? "إلغاء التحديد" : "تحديد للحذف"}
          </button>
          {bulkMode && selectedForDelete.size > 0 && (
            <button
              onClick={deleteSelectedPlayers}
              disabled={deleting}
              className="text-xs bg-mtrred/20 text-red-300 border border-mtrred/40 rounded-lg px-2.5 py-1 hover:bg-mtrred/30 transition disabled:opacity-50"
            >
              {deleting ? "جاري الحذف..." : `حذف (${selectedForDelete.size})`}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[120px]">
          {players.length === 0 && (
            <div className="text-neutral-500 text-xs text-center py-6 leading-relaxed">
              مفيش لاعبين لسه — ابدأ بإضافة أول لاعب.
            </div>
          )}
          {players
            .filter((p) => {
              const q = playerSearch.trim().toLowerCase();
              if (!q) return true;
              return p.name?.toLowerCase().includes(q) || p.player_code?.toLowerCase().includes(q);
            })
            .map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (bulkMode) { toggleSelectForDelete(p.id); return; }
                setSelectedId(p.id);
                setTab("overview");
                if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition ${
                p.id === selectedId && !bulkMode ? "bg-neutral-900 border border-neutral-700" : "border border-transparent hover:bg-neutral-900/50"
              }`}
            >
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={selectedForDelete.has(p.id)}
                  onChange={() => toggleSelectForDelete(p.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-mtrred w-4 h-4 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-neutral-500 truncate">
                  {p.player_code && <span className="text-neutral-600">{p.player_code} · </span>}
                  {p.sport} · حزام {BELT_LABELS[p.current_belt]}
                </div>
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
                  {selectedPlayer.player_code && <span className="text-neutral-600">{selectedPlayer.player_code} · </span>}
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
                ["goals", "أهداف بتاريخ"],
                ["playerchat", "شات اللاعب"],
                ["weight", "الوزن"],
                ["rolls", "سجل السبارينج"],
                ["readiness", "الجاهزية"],
                ["competitions", "البطولات"],
                ["fightcamp", "Fight Camp"],
                ["curriculum", "متطلبات الحزام"],
                ["schedule", "الجدول"],
                ["nutrition", "التغذية"],
                ["exercises", "تمارين"],
                ["requests", "طلبات اللاعب"],
                ["subscription", "الاشتراك"],
                ["attendance", "الحضور"],
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

            {tab === "overview" && (
              <OverviewTab
                analytics={analytics}
                roadmap={roadmap}
                readiness={readiness}
                goals={goals}
                attachments={attachments}
                onNavigate={(nextTab) => setTab(nextTab as any)}
              />
            )}
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
            {tab === "goals" && (
              <GoalsTab goals={goals} onAdd={addGoal} onToggle={toggleGoal} onEditDate={editGoalDate} onDelete={deleteGoal} />
            )}
            {tab === "playerchat" && <PlayerChatLogTab logs={playerChatLogs} />}
            {tab === "weight" && <WeightTab log={weightLog} onAdd={addWeightEntry} onDelete={deleteWeightEntry} />}
            {tab === "rolls" && <RollsTab rolls={rolls} onAdd={addRoll} onDelete={deleteRoll} />}
            {tab === "readiness" && <ReadinessTab readiness={readiness} />}
            {tab === "competitions" && <CompetitionsTab competitions={competitions} onAdd={addCompetition} onDelete={deleteCompetition} selectedPlayer={selectedPlayer} />}
            {tab === "fightcamp" && <FightCampTab playerId={selectedPlayer.id} camps={fightCamps} tasks={fightCampTasks} onChanged={() => loadPlayerData(selectedPlayer.id)} />}
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
            {tab === "subscription" && (
              <SubscriptionTab subscriptions={subscriptions} onAdd={addSubscription} onDelete={deleteSubscription} />
            )}
            {tab === "attendance" && (
              <AttendanceTab attendance={attendance} onAdd={addAttendanceManual} onEdit={editAttendanceDate} onDelete={deleteAttendance} />
            )}
            {tab === "notes" && <NotesTab notes={notes} onAdd={addNote} />}
            {tab === "files" && <AttachmentsTab attachments={attachments} onUpload={uploadFile} />}
            {tab === "assistant" && (
              <AssistantTab player={selectedPlayer} audience="coach" onDataChanged={() => loadPlayerData(selectedPlayer.id)} />
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

function OverviewTab({
  analytics, roadmap, readiness, goals, attachments, onNavigate,
}: {
  analytics: any;
  roadmap: any[];
  readiness: any[];
  goals: any[];
  attachments: any[];
  onNavigate: (tab: string) => void;
}) {
  if (!analytics) return null;
  const trend = analytics.progressTrend || [];
  const openRoadmap = roadmap.filter((item) => item.status !== "RESOLVED");
  const openGoals = goals.filter((goal) => goal.status !== "DONE");
  const latestReadiness = readiness[0];
  const readinessValue = latestReadiness?.score ?? latestReadiness?.readiness_score ?? latestReadiness?.rating ?? "—";
  const last30 = analytics.attendance?.last30Days?.rate ?? 0;
  const last90 = analytics.attendance?.last90Days?.rate ?? 0;
  const nextAction = openRoadmap[0]
    ? { label: "ابدأ من نقطة التطوير الأعلى أولوية", detail: openRoadmap[0].title, tab: "roadmap" }
    : trend.length < 2
      ? { label: "سجّل تقييمًا جديدًا للاعب", detail: "بعد تقييمين أو أكثر سيظهر منحنى التطور", tab: "assess" }
      : { label: "راجع الجاهزية والهدف الحالي", detail: "حافظ على متابعة اللاعب أسبوعيًا", tab: "readiness" };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-l from-[#35101A] via-neutral-950 to-neutral-950 border border-mtrred/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[11px] text-mtrred font-bold tracking-wide mb-1">NEXT BEST ACTION</div>
          <div className="text-base font-bold text-white">{nextAction.label}</div>
          <div className="text-xs text-neutral-400 mt-1">{nextAction.detail}</div>
        </div>
        <button onClick={() => onNavigate(nextAction.tab)} className="bg-mtrred hover:bg-red-700 transition rounded-lg px-4 py-2.5 text-xs font-semibold whitespace-nowrap">
          فتح الإجراء
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="نقاط تطوير مفتوحة" value={openRoadmap.length} tone={openRoadmap.length ? "red" : "green"} onClick={() => onNavigate("roadmap")} />
        <MetricCard label="أهداف نشطة" value={openGoals.length} tone={openGoals.length ? "gold" : "green"} onClick={() => onNavigate("goals")} />
        <MetricCard label="الجاهزية الأخيرة" value={readinessValue} tone="purple" onClick={() => onNavigate("readiness")} />
        <MetricCard label="أدلة وصور وفيديو" value={attachments.length} tone="teal" onClick={() => onNavigate("files")} />
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-neutral-300">تطور المستوى عبر الوقت</div>
            <div className="text-[11px] text-neutral-500 mt-1">المحاور الأربعة مبنية على التقييمات المسجلة</div>
          </div>
          {trend.length < 2 && <button onClick={() => onNavigate("assess")} className="text-[11px] text-mtrred hover:text-red-300">إضافة تقييم</button>}
        </div>
        {trend.length < 2 ? (
          <div className="border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs text-center py-10">
            سجّل تقييمات في أكثر من تاريخ عشان يظهر منحنى التطور
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
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-neutral-300">الحضور والالتزام</div>
            <div className="text-[11px] text-neutral-500 mt-1">الحضور جزء من تفسير التطور وليس رقمًا منفصلًا</div>
          </div>
          <button onClick={() => onNavigate("attendance")} className="text-[11px] text-neutral-400 hover:text-white">فتح السجل</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3">آخر 30 يوم <b className="text-white block text-lg mt-1">{last30}%</b></div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3">آخر 90 يوم <b className="text-white block text-lg mt-1">{last90}%</b></div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone, onClick }: { label: string; value: string | number; tone: string; onClick: () => void }) {
  const tones: Record<string, string> = {
    red: "border-mtrred/40 text-mtrred",
    gold: "border-mtrgold/40 text-mtrgold",
    green: "border-emerald-700/40 text-emerald-400",
    purple: "border-violet-700/40 text-violet-400",
    teal: "border-teal-700/40 text-teal-400",
  };
  return (
    <button onClick={onClick} className={`text-right bg-neutral-950 border rounded-xl p-3 hover:bg-neutral-900 transition ${tones[tone] || tones.red}`}>
      <div className="text-[11px] text-neutral-500 mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </button>
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

function GoalsTab({
  goals, onAdd, onToggle, onEditDate, onDelete,
}: {
  goals: any[];
  onAdd: (t: string, d: string, date: string) => void;
  onToggle: (id: string, status: string) => void;
  onEditDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const submit = () => {
    if (!title.trim() || !targetDate) return;
    onAdd(title.trim(), description.trim(), targetDate);
    setTitle(""); setDescription(""); setTargetDate("");
  };

  const open = goals.filter((g) => g.status === "OPEN");
  const done = goals.filter((g) => g.status === "DONE");

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الهدف (مثلاً: يتقن الـ Armbar من الجارد)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل (اختياري)" rows={2} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none" />
        <div className="flex gap-2">
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          <button onClick={submit} className="bg-mtrred rounded-lg px-4 text-sm font-semibold shrink-0">إضافة هدف</button>
        </div>
      </div>

      <div className="space-y-2">
        {open.map((g: any) => {
          const overdue = g.target_date && g.target_date < today;
          return (
            <div key={g.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={false} onChange={() => onToggle(g.id, "DONE")} className="mt-1 accent-mtrred w-4 h-4 cursor-pointer" />
                <div className="flex-1">
                  <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {g.title}
                    {g.source === "AI" && <span className="text-[10px] text-mtrgold bg-mtrgold/10 border border-mtrgold/30 rounded-full px-2 py-0.5">AI</span>}
                  </div>
                  {g.description && <div className="text-xs text-neutral-400 mt-1">{g.description}</div>}
                  {editingId === g.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-2 py-1 text-xs" />
                      <button onClick={() => { onEditDate(g.id, editDate); setEditingId(null); }} className="text-xs text-green-400">حفظ</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500">إلغاء</button>
                    </div>
                  ) : (
                    <div className={`text-[11px] mt-2 ${overdue ? "text-red-400" : "text-neutral-500"}`}>
                      {overdue ? "متأخر عن: " : "المستهدف: "}{g.target_date}
                      <button onClick={() => { setEditingId(g.id); setEditDate(g.target_date); }} className="text-neutral-500 hover:text-neutral-300 mr-2">تعديل التاريخ</button>
                    </div>
                  )}
                </div>
                <button onClick={() => onDelete(g.id)} className="text-neutral-600 hover:text-red-400 text-xs shrink-0">حذف</button>
              </div>
            </div>
          );
        })}
        {open.length === 0 && <div className="text-neutral-500 text-xs text-center py-6">مفيش أهداف مفتوحة حاليًا.</div>}
      </div>

      {done.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-900">
          <div className="text-[11px] text-neutral-500 mt-3">مُنجزة</div>
          {done.map((g: any) => (
            <div key={g.id} className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 flex items-center justify-between opacity-60">
              <div className="text-sm line-through">{g.title}</div>
              <button onClick={() => onDelete(g.id)} className="text-neutral-600 hover:text-red-400 text-xs">حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerChatLogTab({ logs }: { logs: any[] }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 max-w-lg">
      <div className="text-sm font-semibold text-neutral-300 mb-1">أسئلة اللاعب للمساعد</div>
      <div className="text-[11px] text-neutral-500 mb-4">عرض فقط — شوف اللاعب بيسأل عن إيه عشان تعرف تركّز مع تطويره على إيه.</div>

      {logs.length === 0 ? (
        <div className="text-neutral-500 text-xs text-center py-8">اللاعب لسه ما استخدمش المساعد.</div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {logs.map((l: any, i: number) => (
            <div key={i} className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${l.role === "user" ? "bg-mtrred/20 mr-0 ml-auto text-right" : "bg-neutral-900 ml-0"}`}>
              {l.content}
              <div className="text-[10px] text-neutral-600 mt-1">{new Date(l.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeightTab({ log, onAdd, onDelete }: { log: any[]; onAdd: (w: number, d: string) => void; onDelete: (id: string) => void }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    if (!weight) return;
    onAdd(Number(weight), date);
    setWeight("");
  };

  const chartData = log.map((e: any) => ({ date: e.date.slice(5), weight: e.weight_kg }));

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-3">منحنى الوزن</div>
        {chartData.length < 2 ? (
          <div className="text-neutral-500 text-xs text-center py-10">سجّل وزنين على الأقل عشان يظهر المنحنى.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1E1E21" />
              <XAxis dataKey="date" tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8B8B8F", fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#17171A", border: "1px solid #2A2A2E", fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#C8102E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex gap-2">
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="الوزن كجم" className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 text-sm font-semibold shrink-0">تسجيل</button>
      </div>

      <div className="space-y-1.5">
        {[...log].reverse().map((e: any) => (
          <div key={e.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5">
            <div className="text-sm">{e.weight_kg} كجم <span className="text-neutral-500 text-xs">· {e.date}</span></div>
            <button onClick={() => onDelete(e.id)} className="text-xs text-neutral-600 hover:text-red-400">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RollsTab({ rolls, onAdd, onDelete }: { rolls: any[]; onAdd: (p: string, sl: number, sr: number, n: string) => void; onDelete: (id: string) => void }) {
  const [partner, setPartner] = useState("");
  const [landed, setLanded] = useState("0");
  const [received, setReceived] = useState("0");
  const [notes, setNotes] = useState("");

  const submit = () => {
    onAdd(partner.trim(), Number(landed), Number(received), notes.trim());
    setPartner(""); setLanded("0"); setReceived("0"); setNotes("");
  };

  const totalLanded = rolls.reduce((s, r) => s + r.submissions_landed, 0);
  const totalReceived = rolls.reduce((s, r) => s + r.submissions_received, 0);

  return (
    <div className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-green-400">{totalLanded}</div>
          <div className="text-[11px] text-neutral-500">إنهاءات ضربها</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-red-400">{totalReceived}</div>
          <div className="text-[11px] text-neutral-500">إنهاءات اتضربله</div>
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="اسم شريك السبارينج (اختياري)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-neutral-500">إنهاءات ضربها</label>
            <input type="number" min="0" value={landed} onChange={(e) => setLanded(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-neutral-500">إنهاءات اتضربله</label>
            <input type="number" min="0" value={received} onChange={(e) => setReceived(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">تسجيل رول</button>
      </div>

      <div className="space-y-1.5">
        {rolls.map((r: any) => (
          <div key={r.id} className="bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="text-sm">{r.partner_name || "بدون اسم"} <span className="text-neutral-500 text-xs">· {r.date}</span></div>
              <button onClick={() => onDelete(r.id)} className="text-xs text-neutral-600 hover:text-red-400">حذف</button>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">✅ {r.submissions_landed} ضربها · ❌ {r.submissions_received} اتضربله</div>
            {r.notes && <div className="text-[11px] text-neutral-500 mt-1">{r.notes}</div>}
          </div>
        ))}
        {rolls.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش رولز مسجّلة لسه.</div>}
      </div>
    </div>
  );
}

function ReadinessTab({ readiness }: { readiness: any[] }) {
  const chartData = [...readiness].reverse().map((r: any) => ({
    date: r.date.slice(5), نوم: r.sleep_quality, طاقة: r.energy, وجع: r.soreness,
  }));

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-1">جاهزية اللاعب</div>
        <div className="text-[11px] text-neutral-500 mb-3">اللاعب بيسجّلها بنفسه يوميًا من صفحته — عرض فقط هنا.</div>
        {chartData.length < 2 ? (
          <div className="text-neutral-500 text-xs text-center py-10">لسه مفيش تسجيلات كفاية.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1E1E21" />
              <XAxis dataKey="date" tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#17171A", border: "1px solid #2A2A2E", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="نوم" stroke="#4A9B8E" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="طاقة" stroke="#D4A72C" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="وجع" stroke="#C8102E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="space-y-1.5">
        {readiness.map((r: any) => (
          <div key={r.id} className="bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <div className="text-xs text-neutral-400">{r.date}</div>
            <div className="text-xs">😴 {r.sleep_quality}/5 · ⚡ {r.energy}/5 · 🤕 {r.soreness}/5</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPETITION_RESULTS = [
  "WIN_SUBMISSION", "WIN_POINTS", "WIN_DECISION", "WIN_KO_TKO",
  "LOSS_SUBMISSION", "LOSS_POINTS", "LOSS_DECISION", "LOSS_KO_TKO", "DRAW", "DQ",
];
const RESULT_LABELS: Record<string, string> = {
  WIN_SUBMISSION: "فوز بإنهاء", WIN_POINTS: "فوز بالنقاط", WIN_DECISION: "فوز بقرار", WIN_KO_TKO: "فوز بضربة قاضية",
  LOSS_SUBMISSION: "خسارة بإنهاء", LOSS_POINTS: "خسارة بالنقاط", LOSS_DECISION: "خسارة بقرار", LOSS_KO_TKO: "خسارة بضربة قاضية",
  DRAW: "تعادل", DQ: "استبعاد",
};

function FightCampTab({ playerId, camps, tasks, onChanged }: { playerId: string; camps: any[]; tasks: any[]; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [competitionDate, setCompetitionDate] = useState("");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("TRAINING");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedCamp, setSelectedCamp] = useState(camps[0]?.id || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!selectedCamp && camps[0]?.id) setSelectedCamp(camps[0].id); }, [camps, selectedCamp]);
  const createCamp = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/players/${playerId}/fight-camp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), competitionName, competitionDate, targetWeightKg: targetWeightKg ? Number(targetWeightKg) : null }) });
    setTitle(""); setCompetitionName(""); setCompetitionDate(""); setTargetWeightKg(""); setSaving(false); onChanged();
  };
  const addTask = async () => {
    if (!selectedCamp || !taskTitle.trim()) return;
    setSaving(true);
    await fetch(`/api/players/${playerId}/fight-camp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "task", campId: selectedCamp, title: taskTitle.trim(), category: taskCategory, dueDate: taskDueDate || null }) });
    setTaskTitle(""); setTaskDueDate(""); setSaving(false); onChanged();
  };
  const updateCamp = async (id: string, currentPhase: string) => {
    await fetch(`/api/players/${playerId}/fight-camp`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: id, currentPhase }) });
    onChanged();
  };
  const toggleTask = async (id: string, completed: boolean) => {
    await fetch(`/api/players/${playerId}/fight-camp`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "task", itemId: id, completed }) });
    onChanged();
  };
  const phaseLabels: Record<string, string> = { BUILD: "بناء", INTENSIFY: "تكثيف", TAPER: "تخفيف الحمل", FIGHT_WEEK: "أسبوع البطولة", RECOVERY: "استشفاء" };
  return <div className="space-y-4">
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3">
      <div><div className="text-sm font-semibold text-neutral-200">إنشاء معسكر جديد</div><div className="text-[11px] text-neutral-500 mt-1">اربط البطولة بالوزن والمهام التي سيشاهدها اللاعب.</div></div>
      <div className="grid grid-cols-2 gap-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم المعسكر" className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><input value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} placeholder="اسم البطولة" className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><input type="date" value={competitionDate} onChange={(e) => setCompetitionDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><input type="number" value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} placeholder="الوزن المستهدف كجم" className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /></div>
      <button onClick={createCamp} disabled={saving || !title.trim()} className="bg-mtrred rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50">إنشاء المعسكر</button>
    </div>
    {camps.map((camp: any) => <div key={camp.id} className="bg-neutral-950 border border-mtrred/30 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><div className="text-base font-semibold">{camp.title}</div><div className="text-xs text-neutral-500 mt-1">{camp.competition_name || "بدون بطولة"}{camp.competition_date ? ` · ${camp.competition_date}` : ""}{camp.target_weight_kg ? ` · ${camp.target_weight_kg} كجم` : ""}</div></div><select value={camp.current_phase} onChange={(e) => updateCamp(camp.id, e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-2 py-1.5 text-xs">{Object.entries(phaseLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-2"><input value={selectedCamp === camp.id ? taskTitle : ""} onChange={(e) => { setSelectedCamp(camp.id); setTaskTitle(e.target.value); }} placeholder="مهمة جديدة للمعسكر" className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><select value={selectedCamp === camp.id ? taskCategory : "TRAINING"} onChange={(e) => { setSelectedCamp(camp.id); setTaskCategory(e.target.value); }} className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs"><option value="TRAINING">تدريب</option><option value="SPARRING">Sparring</option><option value="STRENGTH">قوة</option><option value="NUTRITION">تغذية</option><option value="WEIGHT">وزن</option><option value="RECOVERY">استشفاء</option><option value="VIDEO_REVIEW">مراجعة فيديو</option></select></div><div className="flex gap-2"><input type="date" value={selectedCamp === camp.id ? taskDueDate : ""} onChange={(e) => { setSelectedCamp(camp.id); setTaskDueDate(e.target.value); }} className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><button onClick={addTask} className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 text-xs">إضافة مهمة</button></div>
      <div className="space-y-2">{tasks.filter((task: any) => task.camp_id === camp.id).map((task: any) => <label key={task.id} className="flex items-center gap-3 bg-neutral-900 rounded-lg px-3 py-2.5 cursor-pointer"><input type="checkbox" checked={task.completed} onChange={(e) => toggleTask(task.id, e.target.checked)} className="accent-mtrred" /><span className={`text-xs ${task.completed ? "line-through text-neutral-600" : "text-neutral-300"}`}>{task.title}</span><span className="mr-auto text-[10px] text-neutral-600">{task.category}{task.due_date ? ` · ${task.due_date}` : ""}</span></label>)}</div>
    </div>)}
    {camps.length === 0 && <div className="bg-neutral-950 border border-dashed border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">لم يتم إنشاء معسكر لهذا اللاعب بعد.</div>}
  </div>;
}

function CompetitionsTab({ competitions, onAdd, onDelete, selectedPlayer }: { competitions: any[]; onAdd: (p: any) => void; onDelete: (id: string) => void; selectedPlayer: any }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weightClass, setWeightClass] = useState("");
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState("WIN_SUBMISSION");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ competitionName: name.trim(), date, sport: selectedPlayer.sport, weightClass, opponentName: opponent, result, notes });
    setName(""); setWeightClass(""); setOpponent(""); setNotes("");
  };

  const wins = competitions.filter((c) => c.result.startsWith("WIN")).length;
  const losses = competitions.filter((c) => c.result.startsWith("LOSS")).length;

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex gap-4 items-center justify-center">
        <div className="text-center"><div className="text-2xl font-bold text-green-400">{wins}</div><div className="text-[11px] text-neutral-500">فوز</div></div>
        <div className="text-neutral-700">—</div>
        <div className="text-center"><div className="text-2xl font-bold text-red-400">{losses}</div><div className="text-[11px] text-neutral-500">خسارة</div></div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم البطولة" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          <input value={weightClass} onChange={(e) => setWeightClass(e.target.value)} placeholder="فئة الوزن" className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        </div>
        <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="اسم الخصم (اختياري)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <select value={result} onChange={(e) => setResult(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm">
          {COMPETITION_RESULTS.map((r) => <option key={r} value={r}>{RESULT_LABELS[r]}</option>)}
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">إضافة نتيجة</button>
      </div>

      <div className="space-y-2">
        {competitions.map((c: any) => (
          <div key={c.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold">{c.competition_name}</div>
              <button onClick={() => onDelete(c.id)} className="text-xs text-neutral-600 hover:text-red-400">حذف</button>
            </div>
            <div className={`text-xs font-medium ${c.result.startsWith("WIN") ? "text-green-400" : c.result.startsWith("LOSS") ? "text-red-400" : "text-neutral-400"}`}>
              {RESULT_LABELS[c.result]}{c.opponent_name ? ` ضد ${c.opponent_name}` : ""}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">{c.date}{c.weight_class ? ` · ${c.weight_class}` : ""}</div>
            {c.notes && <div className="text-[11px] text-neutral-500 mt-1">{c.notes}</div>}
          </div>
        ))}
        {competitions.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش نتائج بطولات مسجّلة لسه.</div>}
      </div>
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

function AttachmentsTab({ attachments, onUpload }: { attachments: any[]; onUpload: (f: File, metadata: { caption?: string; stage?: string; visibility?: string }) => void }) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [stage, setStage] = useState("TRAINING");
  const [visibility, setVisibility] = useState("COACH_AND_PLAYER");

  const handleFile = async (file: File) => {
    setUploading(true);
    await onUpload(file, { caption: caption.trim(), stage, visibility });
    setCaption("");
    setUploading(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div>
          <div className="text-sm font-semibold text-neutral-300">أضف دليلًا لتطور اللاعب</div>
          <div className="text-[11px] text-neutral-500 mt-1">اربط الصورة أو الفيديو بمرحلة واضحة بدل تخزينه كملف منفصل.</div>
        </div>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="وصف سريع (مثلاً: دفاع الـ takedown في السبارينج)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs" />
        <div className="grid grid-cols-2 gap-2">
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs">
            <option value="TRAINING">تدريب</option>
            <option value="SPARRING">Sparring</option>
            <option value="COMPETITION">بطولة</option>
            <option value="POST_REVIEW">مراجعة بعد البطولة</option>
          </select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs">
            <option value="COACH_AND_PLAYER">المدرب واللاعب</option>
            <option value="COACH_ONLY">المدرب فقط</option>
            <option value="COACH_PLAYER_GUARDIAN">المدرب واللاعب وولي الأمر</option>
          </select>
        </div>
        <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-700 rounded-lg py-6 text-sm text-neutral-400 cursor-pointer hover:border-mtrred transition">
          {uploading ? "جاري الرفع..." : "دوس هنا أو اسحب ملف (صور، فيديو، PDF)"}
          <input
            type="file" accept="image/*,video/*,.pdf" className="hidden" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {attachments.length === 0 && (
          <div className="col-span-2 text-neutral-500 text-xs text-center py-8">مفيش أدلة مرفوعة لسه. ابدأ بأول فيديو مرتبط بمهارة.</div>
        )}
        {attachments.map((a) => (
          <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 hover:border-neutral-600 transition">
            {a.file_type?.startsWith("image/") ? (
              <img src={a.file_url} alt={a.caption || a.file_name} className="w-full h-28 object-cover rounded-lg mb-2" />
            ) : a.file_type?.startsWith("video/") ? (
              <video src={a.file_url} controls className="w-full h-28 object-cover rounded-lg mb-2" />
            ) : (
              <div className="w-full h-28 bg-neutral-900 rounded-lg mb-2 flex items-center justify-center text-neutral-500 text-xs">ملف</div>
            )}
            <div className="text-xs text-neutral-300 truncate">{a.caption || a.file_name}</div>
            <div className="text-[10px] text-neutral-600 mt-1">{a.stage === "SPARRING" ? "Sparring" : a.stage === "COMPETITION" ? "بطولة" : a.stage === "POST_REVIEW" ? "مراجعة" : "تدريب"}</div>
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
function AssistantTab({ player, audience = "coach", onDataChanged }: { player: any; audience?: "coach" | "player"; onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string; actionsTaken?: string[]; imageUrl?: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const send = async () => {
    if ((!input.trim() && !attachedImage) || sending) return;
    setSending(true);
    setError("");

    let imageUrl: string | undefined;
    if (attachedImage) {
      setUploadingImage(true);
      const path = `${player.id}/chat-${Date.now()}-${attachedImage.name}`;
      const { error: upErr } = await supabase.storage.from("player-attachments").upload(path, attachedImage);
      setUploadingImage(false);
      if (upErr) { setError("فشل رفع الصورة: " + upErr.message); setSending(false); return; }
      const { data: pub } = supabase.storage.from("player-attachments").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    const textContent = imageUrl ? `${input.trim()}${input.trim() ? "\n" : ""}[صورة مرفقة: ${imageUrl}]` : input.trim();
    const userMsg = { role: "user", content: textContent };
    const nextMessages = [...messages.map(({ role, content }) => ({ role, content })), userMsg];
    setMessages([...messages, { role: "user", content: input.trim(), imageUrl }]);
    setInput("");
    setAttachedImage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ playerId: player.id, messages: nextMessages, audience }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, actionsTaken: data.actionsTaken }]);
      if (data.actionsTaken?.length > 0 && onDataChanged) onDataChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col h-[500px] max-w-lg">
      <div className="text-sm font-semibold text-neutral-300 mb-1">اسأل المساعد عن {player.name}</div>
      {audience === "coach" && (
        <div className="text-[11px] text-neutral-500 mb-3">
          تقدر تحكي له اللي حصل في الحصة وهو يسجّل التقييمات والملاحظات بنفسه — وأي حاجة يسجّلها تقدر تراجعها أو تعدّلها يدويًا من التابات التانية.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-neutral-500 text-xs text-center py-8 leading-relaxed">
            {audience === "coach"
              ? 'مثلاً: "أدم النهاردة كان ضعيف في دفاع التيك داون، حط له 4 من 10 وضيفله هدف يتحسن بحلول آخر الشهر"'
              : 'اسأل أي حاجة عن تطورك — مثلاً: "إزاي أحسّن دفاع التيك داون بتاعي؟"'}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-left" : ""}>
            <div className={`text-sm rounded-lg px-3 py-2 max-w-[85%] inline-block ${m.role === "user" ? "bg-mtrred/20 mr-0 ml-auto text-right float-right clear-both" : "bg-neutral-900 ml-0 float-left clear-both"}`}>
              {m.content}
              {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />}
            </div>
            {m.actionsTaken && m.actionsTaken.length > 0 && (
              <div className="clear-both mt-1.5 space-y-1">
                {m.actionsTaken.map((a, j) => (
                  <div key={j} className="text-[11px] text-green-300 bg-green-500/10 border border-green-500/20 rounded-md px-2.5 py-1 inline-block ml-1">
                    ✓ {a}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <div className="text-neutral-500 text-xs">{uploadingImage ? "بيرفع الصورة..." : "بيفكر..."}</div>}
        {error && <div className="text-red-400 text-xs">{error}</div>}
      </div>

      {attachedImage && (
        <div className="text-[11px] text-neutral-400 mb-2 flex items-center gap-2">
          📎 {attachedImage.name}
          <button onClick={() => setAttachedImage(null)} className="text-red-400">إلغاء</button>
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex items-center justify-center w-10 h-10 shrink-0 bg-black border border-neutral-700 rounded-lg cursor-pointer text-lg">
          📎
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAttachedImage(e.target.files?.[0] || null)} />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب سؤالك..."
          className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm"
        />
        <button onClick={send} disabled={sending} className="bg-mtrred rounded-lg px-4 text-sm font-semibold disabled:opacity-40">
          إرسال
        </button>
      </div>
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

function RequestsTab({ feedback, onReply }: { feedback: any[]; onReply: (id: string, status: string, reply?: string, imageFile?: File | null) => void }) {
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);

  const submitReply = (id: string) => {
    onReply(id, "REVIEWED", replyText.trim() || undefined, replyImage);
    setReplyingId(null);
    setReplyText("");
    setReplyImage(null);
  };

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
          {f.message && <div className="text-sm text-neutral-200 mb-2">{f.message}</div>}
          {f.image_url && <img src={f.image_url} alt="" className="rounded-lg max-h-56 object-cover mb-3" />}

          {(f.coach_reply || f.coach_reply_image_url) && (
            <div className="bg-mtrred/10 border border-mtrred/20 rounded-lg p-3 mb-2">
              <div className="text-[10px] text-mtrgold mb-1">ردك</div>
              {f.coach_reply && <div className="text-sm text-neutral-200">{f.coach_reply}</div>}
              {f.coach_reply_image_url && <img src={f.coach_reply_image_url} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />}
            </div>
          )}

          {f.status === "PENDING" && (
            replyingId === f.id ? (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك..."
                  rows={2}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm resize-none"
                />
                <label className="flex items-center gap-2 border border-dashed border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-400 cursor-pointer">
                  📷 {replyImage ? replyImage.name : "إرفاق صورة (اختياري)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setReplyImage(e.target.files?.[0] || null)} />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => submitReply(f.id)} className="text-xs bg-mtrred rounded-lg px-3 py-1.5 font-semibold">إرسال الرد</button>
                  <button onClick={() => setReplyingId(null)} className="text-xs text-neutral-500">إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setReplyingId(f.id)}
                  className="text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 hover:border-neutral-500 transition"
                >
                  رد
                </button>
                <button
                  onClick={() => onReply(f.id, "REVIEWED")}
                  className="text-xs text-neutral-500 hover:text-neutral-300"
                >
                  تعليم كمُراجَع بدون رد
                </button>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function SubscriptionTab({ subscriptions, onAdd, onDelete }: { subscriptions: any[]; onAdd: (p: string, a: string, s: string, e: string) => void; onDelete: (id: string) => void }) {
  const [planName, setPlanName] = useState("شهري");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const submit = () => {
    if (!endDate) return;
    onAdd(planName, amount, startDate, endDate);
    setAmount(""); setEndDate("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {["شهري", "ربع سنوي", "نصف سنوي", "سنوي"].map((p) => (
            <button key={p} onClick={() => setPlanName(p)} className={`px-2.5 py-1 rounded-md text-xs border ${planName === p ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{p}</button>
          ))}
        </div>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="المبلغ (اختياري)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] text-neutral-500 mb-1">من</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-neutral-500 mb-1">لحد</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={submit} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">إضافة اشتراك</button>
      </div>

      <div className="space-y-2">
        {subscriptions.map((s: any) => {
          const expired = s.end_date < today;
          return (
            <div key={s.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  {s.plan_name}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${expired ? "bg-mtrred/15 text-red-300" : "bg-green-500/15 text-green-300"}`}>
                    {expired ? "منتهي" : "فعّال"}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  من {s.start_date} لحد {s.end_date}{s.amount ? ` · ${s.amount} جنيه` : ""}
                </div>
              </div>
              <button onClick={() => onDelete(s.id)} className="text-neutral-600 hover:text-red-400 text-xs">حذف</button>
            </div>
          );
        })}
        {subscriptions.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش اشتراكات مسجّلة لسه.</div>}
      </div>
    </div>
  );
}

function AttendanceTab({ attendance, onAdd, onEdit, onDelete }: { attendance: any[]; onAdd: (d: string) => void; onEdit: (id: string, d: string) => void; onDelete: (id: string) => void }) {
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");

  const last30 = attendance.filter((a: any) => {
    const diff = (Date.now() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
        <div className="text-xs text-neutral-500 mb-1">الحضور آخر 30 يوم</div>
        <div className="text-2xl font-bold">{last30} يوم</div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex gap-2">
        <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={() => onAdd(manualDate)} className="bg-mtrred rounded-lg px-4 text-sm font-semibold shrink-0">تسجيل حضور يدوي</button>
      </div>

      <div className="space-y-1.5">
        {attendance.map((a: any) => (
          <div key={a.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5">
            {editingId === a.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-2 py-1 text-xs" />
                <button onClick={() => { onEdit(a.id, editDate); setEditingId(null); }} className="text-xs text-green-400">حفظ</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500">إلغاء</button>
              </div>
            ) : (
              <>
                <div className="text-sm">{a.day_of_week} · {a.date}</div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-600">{a.marked_by === "PLAYER" ? "سجّله اللاعب" : "سجّله الكوتش"}</span>
                  <button onClick={() => { setEditingId(a.id); setEditDate(a.date); }} className="text-xs text-neutral-500 hover:text-neutral-300">تعديل</button>
                  <button onClick={() => onDelete(a.id)} className="text-xs text-neutral-600 hover:text-red-400">حذف</button>
                </div>
              </>
            )}
          </div>
        ))}
        {attendance.length === 0 && <div className="text-neutral-500 text-xs text-center py-8">مفيش حضور مسجّل لسه.</div>}
      </div>
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
