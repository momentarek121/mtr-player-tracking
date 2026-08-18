"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { subscribeToPush } from "@/lib/push";

const DOMAINS: Record<string, { label: string; color: string }> = {
  TECHNICAL: { label: "فني", color: "#C8102E" },
  TACTICAL: { label: "تكتيكي", color: "#D4A72C" },
  PHYSICAL: { label: "بدني", color: "#4A9B8E" },
  MENTAL: { label: "ذهني", color: "#8B7FD4" },
};

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};
const BELT_COLORS: Record<string, string> = {
  WHITE: "#F5F5F0", BLUE: "#3B6FD4", PURPLE: "#7B4FD4", BROWN: "#6B4A2E", BLACK: "#1A1A1C",
};

const monthKey = (iso: string) => iso.slice(0, 7);

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-neutral-900 rounded-lg p-2 text-center"><div className="text-[10px] text-neutral-500">{label}</div><div className="text-xs font-semibold mt-1">{value}</div></div>;
}

function ReviewBadge({ status, source }: { status?: string; source?: string }) {
  const draft = status === "DRAFT" || source === "PLAYER_AI";
  return <span className={`text-[10px] rounded-full px-2 py-1 ${draft ? "text-mtrgold bg-mtrgold/10" : "text-teal-400 bg-teal-400/10"}`}>{draft ? "مسودة — تحتاج مراجعة المدرب" : "معتمدة"}</span>;
}

export default function PlayerSelfView({ params }: { params: { id: string } }) {
  const playerId = params.id;
  const [player, setPlayer] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [chatGoals, setChatGoals] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState("");
  const [readiness, setReadiness] = useState<any[]>([]);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [readinessSaving, setReadinessSaving] = useState(false);
  const [readinessMsg, setReadinessMsg] = useState("");
  const [fightCamps, setFightCamps] = useState<any[]>([]);
  const [fightCampTasks, setFightCampTasks] = useState<any[]>([]);
  const [performancePrograms, setPerformancePrograms] = useState<any[]>([]);
  const [performanceItems, setPerformanceItems] = useState<any[]>([]);
  const [rollPartner, setRollPartner] = useState("");
  const [rollLanded, setRollLanded] = useState("0");
  const [rollReceived, setRollReceived] = useState("0");
  const [rollSaving, setRollSaving] = useState(false);
  const [rollMsg, setRollMsg] = useState("");
  const [matchOpponent, setMatchOpponent] = useState("");
  const [matchResult, setMatchResult] = useState("WIN");
  const [matchNotes, setMatchNotes] = useState("");
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchMsg, setMatchMsg] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackImageFile, setFeedbackImageFile] = useState<File | null>(null);
  const [feedbackUploading, setFeedbackUploading] = useState(false);
  const [feedbackThread, setFeedbackThread] = useState<any[]>([]);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("players").select("*").eq("id", playerId).single();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setPlayer(p);

      const [{ data: a }, { data: r }, { data: f }, { data: sch }, { data: mls }, { data: exs }, { data: att }, { data: fb }, { data: rdn }, { data: gls }] = await Promise.all([
        supabase.from("skill_assessments").select("*, skill_categories(name,domain)").eq("player_id", playerId).order("date"),
        supabase.from("player_roadmap_items").select("*").eq("player_id", playerId).eq("status", "OPEN").order("priority"),
        supabase.from("player_attachments").select("*").eq("player_id", playerId).order("uploaded_at", { ascending: false }),
        supabase.from("player_schedule").select("*").eq("player_id", playerId),
        supabase.from("player_meals").select("*").eq("player_id", playerId).order("sort_order"),
        supabase.from("player_exercises").select("*").eq("player_id", playerId).order("assigned_at", { ascending: false }),
        supabase.from("player_attendance").select("*").eq("player_id", playerId).order("date", { ascending: false }).limit(10),
        supabase.from("player_feedback").select("*").eq("player_id", playerId).order("created_at", { ascending: false }),
        supabase.from("player_readiness").select("*").eq("player_id", playerId).order("date", { ascending: false }).limit(7),
        supabase.from("player_goals").select("*").eq("player_id", playerId).order("created_at", { ascending: false }).limit(20),
      ]);
      setAssessments(a || []);
      setRoadmap(r || []);
      setAttachments(f || []);
      setSchedule(sch || []);
      setMeals(mls || []);
      setExercises(exs || []);
      setAttendance(att || []);
      setFeedbackThread(fb || []);
      setReadiness(rdn || []);
      setChatGoals(gls || []);
      setLoading(false);
    })();
  }, [playerId]);

  useEffect(() => {
    (async () => {
      const { data: camps } = await supabase.from("fight_camps").select("*").eq("player_id", playerId).eq("status", "ACTIVE").order("competition_date", { ascending: true });
      setFightCamps(camps || []);
      const ids = (camps || []).map((c: any) => c.id);
      if (ids.length) {
        const { data: tasks } = await supabase.from("fight_camp_tasks").select("*").in("camp_id", ids).order("due_date", { ascending: true, nullsFirst: false });
        setFightCampTasks(tasks || []);
      }
    })();
  }, [playerId]);

  useEffect(() => {
    (async () => {
      const { data: programs } = await supabase.from("performance_programs").select("*").eq("player_id", playerId).eq("status", "ACTIVE").order("start_date", { ascending: false, nullsFirst: false });
      setPerformancePrograms(programs || []);
      const ids = (programs || []).map((p: any) => p.id);
      if (ids.length) {
        const { data: items } = await supabase.from("performance_program_items").select("*").in("program_id", ids).order("created_at");
        setPerformanceItems(items || []);
      }
    })();
  }, [playerId]);

  const togglePerformanceItem = async (id: string, completed: boolean) => {
    await supabase.from("performance_program_items").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
    setPerformanceItems((prev) => prev.map((item) => item.id === id ? { ...item, completed } : item));
  };

  const toggleCampTask = async (id: string, completed: boolean) => {
    await supabase.from("fight_camp_tasks").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
    setFightCampTasks((prev) => prev.map((task) => task.id === id ? { ...task, completed, completed_at: completed ? new Date().toISOString() : null } : task));
  };

  const toggleExercise = async (id: string, completed: boolean) => {
    await supabase.from("player_exercises").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, completed } : e)));
  };

  const todayReadinessDone = readiness.some((r: any) => r.date === new Date().toISOString().slice(0, 10));

  const submitReadiness = async () => {
    setReadinessSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("player_readiness")
      .upsert({ player_id: playerId, sleep_quality: sleepQuality, energy, soreness, date: today }, { onConflict: "player_id,date" })
      .select().single();
    if (data) setReadiness((prev) => [data, ...prev.filter((r: any) => r.date !== today)]);
    setReadinessSaving(false);
    setReadinessMsg("✓ اتسجّلت جاهزيتك النهاردة");
    setTimeout(() => setReadinessMsg(""), 3000);
  };

  const submitRoll = async () => {
    setRollSaving(true);
    const { data } = await supabase
      .from("player_rolls")
      .insert({ player_id: playerId, partner_name: rollPartner.trim() || null, submissions_landed: Number(rollLanded), submissions_received: Number(rollReceived) })
      .select().single();
    setRollSaving(false);
    if (data) {
      setRollPartner(""); setRollLanded("0"); setRollReceived("0");
      setRollMsg("✓ اترجل الرول");
      setTimeout(() => setRollMsg(""), 3000);
    }
  };

  const submitMatchResult = async () => {
    if (!activeCamp) return;
    setMatchSaving(true);
    const { error } = await supabase.from("competition_results").insert({
      player_id: playerId,
      competition_name: activeCamp.competition_name || activeCamp.title,
      date: todayIso,
      sport: player.sport,
      weight_class: activeCamp.weight_class || (activeCamp.target_weight_kg ? `${activeCamp.target_weight_kg} كجم` : null),
      opponent_name: matchOpponent.trim() || null,
      result: matchResult,
      notes: matchNotes.trim() || null,
    });
    setMatchSaving(false);
    if (error) { setMatchMsg("حصل خطأ في تسجيل النتيجة"); return; }
    setMatchOpponent(""); setMatchNotes("");
    setMatchMsg("✓ اتسجلت نتيجة النزال");
    setTimeout(() => setMatchMsg(""), 3000);
  };

  const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const todayIso = new Date().toISOString().slice(0, 10);
  const alreadyCheckedInToday = attendance.some((a: any) => a.date === todayIso);

  const checkInToday = async () => {
    setCheckingIn(true);
    setCheckinMsg("");
    const dayOfWeek = WEEKDAYS_AR[new Date().getDay()];
    const { error } = await supabase
      .from("player_attendance")
      .insert({ player_id: playerId, date: todayIso, day_of_week: dayOfWeek, marked_by: "PLAYER" });
    if (error) {
      setCheckinMsg(error.message.includes("duplicate") ? "مسجّل حضورك النهارده بالفعل ✓" : "حصل خطأ، جرب تاني");
    } else {
      setAttendance((prev) => [{ id: Date.now().toString(), date: todayIso, day_of_week: dayOfWeek, marked_by: "PLAYER" }, ...prev]);
      setCheckinMsg("✓ اتسجل حضورك النهارده");
    }
    setCheckingIn(false);
  };

  const enableNotifications = async () => {
    setNotifyLoading(true);
    const res = await subscribeToPush(playerId);
    setNotifyMsg(res.ok ? "✓ الإشعارات اتفعّلت" : res.error || "حصل خطأ");
    setNotifyLoading(false);
  };

  const submitFeedback = async () => {
    if (!feedbackMsg.trim() && !feedbackImageFile) return;
    setFeedbackUploading(true);
    let imageUrl: string | null = null;

    if (feedbackImageFile) {
      const path = `${playerId}/${Date.now()}-${feedbackImageFile.name}`;
      const { error: upErr } = await supabase.storage.from("player-attachments").upload(path, feedbackImageFile);
      if (upErr) { alert("فشل رفع الصورة: " + upErr.message); setFeedbackUploading(false); return; }
      const { data: pub } = supabase.storage.from("player-attachments").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    const { data } = await supabase
      .from("player_feedback")
      .insert({ player_id: playerId, message: feedbackMsg.trim(), image_url: imageUrl })
      .select().single();

    if (data) setFeedbackThread((prev) => [data, ...prev]);
    setFeedbackMsg("");
    setFeedbackImageFile(null);
    setFeedbackUploading(false);
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const latestScores = useMemo(() => {
    const map: Record<string, number> = {};
    [...assessments].sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((a) => { map[a.skill_category_id] = a.score; });
    return map;
  }, [assessments]);

  const domainAverages = useMemo(() => {
    const byDomain: Record<string, number[]> = {};
    assessments.forEach((a) => {
      const domain = a.skill_categories?.domain;
      const id = a.skill_category_id;
      if (!domain || latestScores[id] === undefined) return;
      if (!byDomain[domain]) byDomain[domain] = [];
    });
    // recompute cleanly from latest scores only
    Object.entries(latestScores).forEach(([skillId, score]) => {
      const a = assessments.find((x) => x.skill_category_id === skillId);
      const domain = a?.skill_categories?.domain;
      if (!domain) return;
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(score);
    });
    return Object.keys(DOMAINS).map((domain) => {
      const scores = byDomain[domain] || [];
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { domain, label: DOMAINS[domain].label, value: Math.round(avg * 10) / 10, fullMark: 10 };
    });
  }, [assessments, latestScores]);

  const trendData = useMemo(() => {
    const buckets: Record<string, Record<string, number[]>> = {};
    assessments.forEach((a) => {
      const mk = monthKey(a.date);
      const domain = a.skill_categories?.domain;
      if (!domain) return;
      if (!buckets[mk]) buckets[mk] = {};
      if (!buckets[mk][domain]) buckets[mk][domain] = [];
      buckets[mk][domain].push(a.score);
    });
    return Object.entries(buckets).sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, domains]) => {
      const row: any = { month };
      Object.entries(domains).forEach(([domain, scores]) => {
        row[domain] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      });
      return row;
    });
  }, [assessments]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;
  }
  if (notFound) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">اللاعب ده مش موجود.</div>;
  }

  if (player.approval_status === "PENDING") {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-xl bg-mtrred flex items-center justify-center font-bold text-lg mx-auto mb-4">MTR</div>
          <div className="text-lg font-semibold mb-2">أهلًا {player.name} 👋</div>
          <div className="text-sm text-neutral-400 leading-relaxed mb-4">
            بياناتك اتسجّلت بنجاح، وحاليًا بانتظار موافقة المدرب. بمجرد ما يوافق هتقدر تشوف تطورك الكامل، خطتك، والمساعد الذكي.
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-xs font-mono text-mtrgold">
            كودك: {player.player_code}
          </div>
        </div>
      </div>
    );
  }

  const hasRadarData = domainAverages.some((d) => d.value > 0);
  const activeCamp = fightCamps[0];
  const competitionDate = activeCamp?.competition_date ? new Date(`${activeCamp.competition_date}T12:00:00`) : null;
  const daysToCompetition = competitionDate ? Math.ceil((competitionDate.getTime() - new Date(`${todayIso}T12:00:00`).getTime()) / 86400000) : null;
  const targetWeight = activeCamp?.target_weight_kg ?? activeCamp?.target_weight ?? null;
  const weightDelta = targetWeight != null && player.weight_kg != null ? Number(player.weight_kg) - Number(targetWeight) : null;
  const latestReadiness = readiness[0];
  const readinessScore = latestReadiness ? Math.round(((Number(latestReadiness.sleep_quality || 0) + Number(latestReadiness.energy || 0) + (6 - Number(latestReadiness.soreness || 0))) / 15) * 100) : null;
  const openCampTasks = fightCampTasks.filter((task: any) => !task.completed);
  const dueTodayTasks = openCampTasks.filter((task: any) => task.due_date === todayIso);
  const nextCampTask = openCampTasks[0];
  const playerDecision = dueTodayTasks.length > 0
    ? `ابدأ بـ ${dueTodayTasks[0].title}`
    : nextCampTask
      ? `ركّز على ${nextCampTask.title}`
      : !todayReadinessDone
        ? "سجّل جاهزيتك قبل التمرين"
        : "راجع خطتك ونفّذ جلسة اليوم";

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-lg bg-mtrred flex items-center justify-center font-bold text-xs">MTR</div>
        <div className="text-xs text-neutral-500">بروفايل اللاعب — عرض فقط</div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: BELT_COLORS[player.current_belt] }}>
          {player.photo_url && <img src={player.photo_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div>
          <div className="text-2xl font-semibold">{player.name}</div>
          <div className="text-neutral-400 text-sm mt-1">
            {player.player_code && <span className="text-neutral-600">{player.player_code} · </span>}
            {player.sport} · حزام {BELT_LABELS[player.current_belt]} · {player.weight_kg} كجم
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-mtrred/20 via-neutral-950 to-neutral-950 border border-mtrred/50 rounded-2xl p-5 mb-5 shadow-lg shadow-mtrred/5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-mtrred font-semibold">Championship Command Center</div>
            <div className="text-xl font-semibold mt-1">{activeCamp ? activeCamp.competition_name || activeCamp.title : "جاهز للبطولة القادمة"}</div>
            <div className="text-xs text-neutral-400 mt-1">قرارك العملي الآن: <span className="text-neutral-100 font-medium">{playerDecision}</span></div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-mtrgold">{daysToCompetition == null ? "—" : daysToCompetition < 0 ? "انتهت" : daysToCompetition === 0 ? "اليوم" : daysToCompetition}</div>
            <div className="text-[10px] text-neutral-500">{daysToCompetition != null && daysToCompetition >= 0 ? "يوم للبطولة" : "موعد البطولة"}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-black/30 rounded-xl p-3"><div className="text-[10px] text-neutral-500">الجاهزية</div><div className="text-lg font-semibold mt-1">{readinessScore == null ? "سجّلها" : `${readinessScore}%`}</div><div className="text-[10px] text-neutral-600 mt-1">{todayReadinessDone ? "تم تسجيل اليوم" : "مطلوب قبل التمرين"}</div></div>
          <div className="bg-black/30 rounded-xl p-3"><div className="text-[10px] text-neutral-500">الوزن</div><div className="text-lg font-semibold mt-1">{player.weight_kg || "—"} <span className="text-xs font-normal">كجم</span></div><div className={`text-[10px] mt-1 ${weightDelta != null && weightDelta > 0 ? "text-mtrred" : "text-teal-400"}`}>{targetWeight == null ? "لا يوجد هدف وزن" : `${weightDelta > 0 ? "فوق الهدف بـ" : "الفرق عن الهدف"} ${Math.abs(weightDelta).toFixed(1)} كجم`}</div></div>
          <div className="bg-black/30 rounded-xl p-3"><div className="text-[10px] text-neutral-500">مهام المعسكر</div><div className="text-lg font-semibold mt-1">{openCampTasks.length}</div><div className="text-[10px] text-neutral-600 mt-1">{dueTodayTasks.length ? `${dueTodayTasks.length} مستحقة اليوم` : "مفتوحة"}</div></div>
          <div className="bg-black/30 rounded-xl p-3"><div className="text-[10px] text-neutral-500">الحضور</div><div className="text-lg font-semibold mt-1">{attendance.length}</div><div className="text-[10px] text-neutral-600 mt-1">آخر 10 تسجيلات</div></div>
        </div>
        {activeCamp?.competition_date && <div className="text-[11px] text-neutral-500 mt-4">موعد البطولة: {activeCamp.competition_date} · مرحلة المعسكر: {activeCamp.current_phase || "—"}</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="bg-neutral-950 border border-mtrgold/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3"><div className="text-sm font-semibold">مهمتك الآن</div><span className="text-[10px] text-mtrgold bg-mtrgold/10 rounded-full px-2 py-1">TODAY</span></div>
          <div className="text-lg font-semibold mb-2">{playerDecision}</div>
          <div className="text-xs text-neutral-500 leading-relaxed">نفّذ المهمة، علّمها كمكتملة، وسجّل جاهزيتك بعد الجلسة. المدرب هيشوف التقدم مباشرة.</div>
        </div>
        <div className="bg-neutral-950 border border-teal-700/40 rounded-xl p-5">
          <div className="text-sm font-semibold mb-3">Check-in سريع</div>
          <div className="grid grid-cols-3 gap-2 mb-3"><MiniMetric label="نوم" value={`${sleepQuality}/5`} /><MiniMetric label="طاقة" value={`${energy}/5`} /><MiniMetric label="ألم/إجهاد" value={`${soreness}/5`} /></div>
          <button onClick={submitReadiness} disabled={readinessSaving} className="w-full bg-teal-700/80 hover:bg-teal-700 rounded-lg py-2.5 text-xs font-semibold">{readinessSaving ? "جاري التسجيل..." : todayReadinessDone ? "تحديث جاهزيتي اليوم" : "سجّل جاهزيتي اليوم"}</button>
          {readinessMsg && <div className="text-[11px] text-teal-400 mt-2">{readinessMsg}</div>}
        </div>
      </div>

      {activeCamp && (daysToCompetition != null && daysToCompetition <= 7) && (
        <div className="bg-neutral-950 border border-mtrred/50 rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div><div className="text-[11px] uppercase tracking-wider text-mtrred font-semibold">Match Day Mode</div><div className="text-lg font-semibold mt-1">يوم المباراة / النزال</div></div>
            <div className="text-xs text-mtrgold bg-mtrgold/10 rounded-full px-2.5 py-1">{daysToCompetition === 0 ? "اليوم" : `${daysToCompetition} أيام`}</div>
          </div>
          <div className="grid md:grid-cols-3 gap-2 mb-4">
            <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">قبل النزال</div><div className="text-xs mt-1">وزّن نفسك، اشرب حسب خطة المدرب، وسجّل جاهزيتك.</div></div>
            <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">داخل النزال</div><div className="text-xs mt-1">التزم بأولوياتك: الوضعية، التنفس، والـ game plan.</div></div>
            <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">بعد النزال</div><div className="text-xs mt-1">استشفِ، اكتب ما حدث، وسجّل النتيجة للمدرب.</div></div>
          </div>
          <div className="border-t border-neutral-800 pt-4">
            <div className="text-sm font-semibold mb-3">تسجيل نتيجة النزال</div>
            <div className="grid md:grid-cols-3 gap-2 mb-2">
              <input value={matchOpponent} onChange={(e) => setMatchOpponent(e.target.value)} placeholder="اسم المنافس" className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-mtrred" />
              <select value={matchResult} onChange={(e) => setMatchResult(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs outline-none"><option value="WIN">فوز</option><option value="LOSS">خسارة</option><option value="DRAW">تعادل</option><option value="DNC">لم يلعب</option></select>
              <input value={matchNotes} onChange={(e) => setMatchNotes(e.target.value)} placeholder="ملاحظة سريعة" className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-mtrred" />
            </div>
            <button onClick={submitMatchResult} disabled={matchSaving} className="w-full bg-mtrred hover:bg-red-700 rounded-lg py-2.5 text-xs font-semibold">{matchSaving ? "جاري التسجيل..." : "سجّل النتيجة"}</button>
            {matchMsg && <div className="text-[11px] text-teal-400 mt-2">{matchMsg}</div>}
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">مستواك الحالي — حسب المحور</div>
          {!hasRadarData ? (
            <div className="text-neutral-500 text-xs text-center py-10">لسه مفيش تقييمات مسجّلة.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={domainAverages}>
                <PolarGrid stroke="#2A2A2E" />
                <PolarAngleAxis dataKey="label" tick={{ fill: "#B5B5B8", fontSize: 13 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#5A5A5E", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#C8102E" fill="#C8102E" fillOpacity={0.35} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">تطورك عبر الوقت</div>
          {trendData.length < 2 ? (
            <div className="text-neutral-500 text-xs text-center py-10">محتاج تقييمات في أكتر من تاريخ عشان يظهر المنحنى.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
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
          <div className="text-sm font-semibold text-neutral-300 mb-3">النقط اللي المدرب طالبك تركز عليها</div>
          {roadmap.length === 0 ? (
            <div className="text-neutral-500 text-xs text-center py-6">مفيش نقاط تطوير مفتوحة حاليًا 👏</div>
          ) : (
            <div className="space-y-2.5">
              {roadmap.map((item: any) => (
                <div key={item.id} className="flex gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.priority === 1 ? "bg-mtrred" : "bg-mtrgold"}`} />
                  <div>
                    <div className="text-sm font-semibold mb-1">{item.title}</div>
                    <div className="text-xs text-neutral-400 leading-relaxed">{item.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(chatGoals.some((g: any) => g.source === "PLAYER_AI") || meals.some((m: any) => m.source === "PLAYER_AI") || exercises.some((e: any) => e.source === "PLAYER_AI")) && (
          <div className="bg-neutral-950 border border-mtrgold/30 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><div className="text-sm font-semibold text-neutral-200">خطة الشات</div><div className="text-[11px] text-neutral-500 mt-1">أي اقتراح من المساعد يظهر هنا ويتحول لخطة بعد مراجعة المدرب.</div></div>
              <div className="text-[10px] text-mtrgold bg-mtrgold/10 rounded-full px-2.5 py-1">AI PLAN</div>
            </div>
            <div className="space-y-2">
              {chatGoals.filter((g: any) => g.source === "PLAYER_AI").slice(0, 5).map((g: any) => <div key={`goal-${g.id}`} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"><div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold">هدف: {g.title}</div><ReviewBadge status={g.review_status} source={g.source} /></div>{g.description && <div className="text-xs text-neutral-500 mt-1">{g.description}</div>}{g.target_date && <div className="text-[10px] text-neutral-600 mt-1">الموعد: {g.target_date}</div>}</div>)}
              {exercises.filter((e: any) => e.source === "PLAYER_AI").slice(0, 5).map((e: any) => <div key={`exercise-${e.id}`} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"><div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold">تمرين: {e.title}</div><ReviewBadge status={e.review_status} source={e.source} /></div>{e.description && <div className="text-xs text-neutral-500 mt-1">{e.description}</div>}{e.due_date && <div className="text-[10px] text-neutral-600 mt-1">الموعد: {e.due_date}</div>}</div>)}
              {meals.filter((m: any) => m.source === "PLAYER_AI").slice(0, 5).map((m: any) => <div key={`meal-${m.id}`} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"><div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold">وجبة: {m.title}</div><ReviewBadge status={m.review_status} source={m.source} /></div><div className="text-xs text-mtrgold mt-1">{m.meal_time}</div>{m.description && <div className="text-xs text-neutral-500 mt-1">{m.description}</div>}</div>)}
            </div>
          </div>
        )}

        {performancePrograms.length > 0 && (
          <div className="bg-neutral-950 border border-teal-700/40 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4"><div><div className="text-sm font-semibold text-neutral-200">برنامج الأداء البدني</div><div className="text-[11px] text-neutral-500 mt-1">الخطة المخصصة لك من مدرب الأداء البدني.</div></div><div className="text-[10px] text-teal-400 bg-teal-400/10 rounded-full px-2.5 py-1">Performance</div></div>
            {performancePrograms.map((program: any) => {
              const programItems = performanceItems.filter((item: any) => item.program_id === program.id);
              return <div key={program.id} className="mb-4 last:mb-0"><div className="bg-neutral-900 rounded-lg p-3 mb-2"><div className="text-sm font-semibold">{program.title}</div>{program.goal && <div className="text-xs text-neutral-500 mt-1">الهدف: {program.goal}</div>}</div><div className="space-y-2">{programItems.map((item: any) => <label key={item.id} className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-3 cursor-pointer"><input type="checkbox" checked={item.completed} onChange={(e) => togglePerformanceItem(item.id, e.target.checked)} className="mt-0.5 accent-mtrred w-4 h-4" /><div className="min-w-0"><div className={`text-sm ${item.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{item.exercise_name}</div><div className="text-[10px] text-neutral-600 mt-1">{item.category}{item.sets ? ` · ${item.sets} sets` : ""}{item.reps ? ` · ${item.reps} reps` : ""}{item.load ? ` · ${item.load}` : ""}</div>{item.instructions && <div className="text-xs text-neutral-500 mt-1">{item.instructions}</div>}</div></label>)}{programItems.length === 0 && <div className="text-xs text-neutral-500 text-center py-3">المدرب لم يضف تمارين للبرنامج بعد.</div>}</div></div>;
            })}
          </div>
        )}

        {fightCamps.length > 0 && (
          <div className="bg-neutral-950 border border-mtrred/30 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-semibold text-neutral-200">معسكر البطولة</div>
                <div className="text-[11px] text-neutral-500 mt-1">نفّذ المهام وسجّل الجاهزية عشان المدرب يشوف تقدمك يومًا بيوم.</div>
              </div>
              <div className="text-[10px] bg-mtrred/15 text-mtrred rounded-full px-2.5 py-1">ACTIVE</div>
            </div>
            {fightCamps.map((camp: any) => {
              const campTasks = fightCampTasks.filter((task: any) => task.camp_id === camp.id);
              const completed = campTasks.filter((task: any) => task.completed).length;
              const phaseLabels: Record<string, string> = { BUILD: "بناء", INTENSIFY: "تكثيف", TAPER: "تخفيف الحمل", FIGHT_WEEK: "أسبوع البطولة", RECOVERY: "استشفاء" };
              return (
                <div key={camp.id}>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">المعسكر</div><div className="text-sm mt-1">{camp.title}</div></div>
                    <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">المرحلة</div><div className="text-sm mt-1 text-mtrgold">{phaseLabels[camp.current_phase] || camp.current_phase}</div></div>
                    <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">البطولة</div><div className="text-sm mt-1">{camp.competition_name || "لم تحدد"}</div></div>
                    <div className="bg-neutral-900 rounded-lg p-3"><div className="text-[10px] text-neutral-500">التقدم</div><div className="text-sm mt-1">{completed}/{campTasks.length} مهام</div></div>
                  </div>
                  {campTasks.length === 0 ? (
                    <div className="text-xs text-neutral-500 text-center py-4">لم يضف المدرب مهام المعسكر بعد.</div>
                  ) : (
                    <div className="space-y-2">
                      {campTasks.map((task: any) => (
                        <label key={task.id} className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-3 cursor-pointer">
                          <input type="checkbox" checked={task.completed} onChange={(e) => toggleCampTask(task.id, e.target.checked)} className="mt-0.5 accent-mtrred w-4 h-4" />
                          <div className="min-w-0"><div className={`text-sm ${task.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{task.title}</div>{task.description && <div className="text-xs text-neutral-500 mt-1">{task.description}</div>}<div className="text-[10px] text-neutral-600 mt-1">{task.category}{task.due_date ? ` · قبل ${task.due_date}` : ""}</div></div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">تمارينك المكلّف بيها</div>
          {exercises.length === 0 ? (
            <div className="text-neutral-500 text-xs text-center py-6">مفيش تمارين متكلّف بيها حاليًا.</div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex: any) => (
                <label key={ex.id} className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-3 cursor-pointer">
                  <input
                    type="checkbox" checked={ex.completed}
                    onChange={(e) => toggleExercise(ex.id, e.target.checked)}
                    className="mt-0.5 accent-mtrred w-4 h-4"
                  />
                  <div>
                    <div className={`text-sm ${ex.completed ? "text-neutral-500 line-through" : "text-neutral-200"}`}>{ex.title}</div>
                    {ex.description && <div className="text-xs text-neutral-500 mt-1">{ex.description}</div>}
                    {ex.due_date && <div className="text-[11px] text-neutral-600 mt-1">قبل: {ex.due_date}</div>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {schedule.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-neutral-300 mb-3">جدولك الأسبوعي</div>
            <div className="space-y-1.5">
              {schedule.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-neutral-900 rounded-lg px-3.5 py-2.5">
                  <div className="text-sm">{s.activity}</div>
                  <div className="text-xs text-neutral-500">{s.day_of_week}{s.time_label ? ` · ${s.time_label}` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {meals.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-neutral-300 mb-3">خطتك الغذائية</div>
            <div className="space-y-2">
              {meals.map((m: any) => (
                <div key={m.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                  <div className="text-xs text-mtrgold font-medium mb-1">{m.meal_time}</div>
                  <div className="text-sm">{m.title}</div>
                  {m.description && <div className="text-xs text-neutral-500 mt-1">{m.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-neutral-300 mb-3">ملفات وفيديوهات</div>
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((a: any) => (
                <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 hover:border-neutral-600 transition">
                  {a.file_type?.startsWith("image/") ? (
                    <img src={a.file_url} alt={a.file_name} className="w-full h-24 object-cover rounded-md mb-2" />
                  ) : (
                    <div className="w-full h-24 bg-black rounded-md mb-2 flex items-center justify-center text-neutral-500 text-xs">ملف</div>
                  )}
                  <div className="text-xs text-neutral-300 truncate">{a.file_name}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">جاهزيتك النهاردة</div>
          {todayReadinessDone ? (
            <div className="text-xs text-green-400 text-center py-3">✓ سجّلت جاهزيتك النهاردة، شكرًا!</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "جودة النوم", val: sleepQuality, set: setSleepQuality, icon: "😴" },
                { label: "الطاقة", val: energy, set: setEnergy, icon: "⚡" },
                { label: "الوجع/الإجهاد", val: soreness, set: setSoreness, icon: "🤕" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs text-neutral-400">{f.icon} {f.label}: {f.val}/5</label>
                  <input type="range" min={1} max={5} value={f.val} onChange={(e) => f.set(Number(e.target.value))} className="w-full accent-mtrred" />
                </div>
              ))}
              <button onClick={submitReadiness} disabled={readinessSaving} className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
                {readinessSaving ? "..." : "تسجيل الجاهزية"}
              </button>
              {readinessMsg && <div className="text-xs text-green-400 text-center">{readinessMsg}</div>}
            </div>
          )}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">سجّل رول سبارينج</div>
          <input value={rollPartner} onChange={(e) => setRollPartner(e.target.value)} placeholder="اسم شريك السبارينج (اختياري)" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-2" />
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[11px] text-neutral-500">إنهاءات ضربتها</label>
              <input type="number" min="0" value={rollLanded} onChange={(e) => setRollLanded(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-neutral-500">إنهاءات اتضربتلك</label>
              <input type="number" min="0" value={rollReceived} onChange={(e) => setRollReceived(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={submitRoll} disabled={rollSaving} className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
            {rollSaving ? "..." : "تسجيل الرول"}
          </button>
          {rollMsg && <div className="text-xs text-green-400 text-center mt-2">{rollMsg}</div>}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-2">إشعارات</div>
          <div className="text-[11px] text-neutral-500 mb-3">فعّلها عشان توصلك تذكيرات بالنظام الغذائي وتنبيه لو اشتراكك قرّب يخلص — حتى لو الموقع مقفول.</div>
          <button
            onClick={enableNotifications}
            disabled={notifyLoading}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 text-sm hover:border-neutral-500 transition disabled:opacity-50"
          >
            {notifyLoading ? "..." : "🔔 فعّل الإشعارات"}
          </button>
          {notifyMsg && <div className="text-xs text-neutral-400 mt-2 text-center">{notifyMsg}</div>}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">حضورك النهارده</div>
          <button
            onClick={checkInToday}
            disabled={checkingIn || alreadyCheckedInToday}
            className="w-full bg-mtrred rounded-lg py-3 text-sm font-semibold disabled:opacity-40 disabled:bg-neutral-800"
          >
            {alreadyCheckedInToday ? "✓ اتسجل حضورك النهارده" : checkingIn ? "..." : `سجّل حضورك — ${new Date().toLocaleDateString("ar-EG", { weekday: "long" })}`}
          </button>
          {checkinMsg && <div className="text-xs text-neutral-400 mt-2 text-center">{checkinMsg}</div>}

          {attendance.length > 0 && (
            <div className="mt-4 space-y-1">
              <div className="text-[11px] text-neutral-500 mb-1">آخر أيام حضور</div>
              {attendance.slice(0, 6).map((a: any) => (
                <div key={a.id} className="text-xs text-neutral-400 bg-neutral-900 rounded-lg px-3 py-1.5">
                  {a.day_of_week} · {a.date}
                </div>
              ))}
            </div>
          )}
        </div>

        <PlayerChat player={player} />

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-neutral-300 mb-1">راسل المدرب</div>
          <div className="text-[11px] text-neutral-500 mb-3">مثلاً: طلب تعديل في الجدول، ملاحظة عن إصابة، صورة إصابة أو تكنيك، أو أي حاجة عايز توصلها</div>
          <textarea
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            rows={3}
            className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-3 resize-none"
          />

          <label className="flex items-center gap-2 border border-dashed border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-400 cursor-pointer mb-3 hover:border-neutral-500 transition">
            📷 {feedbackImageFile ? feedbackImageFile.name : "إرفاق صورة (اختياري)"}
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => setFeedbackImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            onClick={submitFeedback}
            disabled={feedbackUploading}
            className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {feedbackUploading ? "جاري الإرسال..." : feedbackSent ? "✓ اتبعتت" : "إرسال للمدرب"}
          </button>

          {feedbackThread.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-neutral-900 pt-4">
              {feedbackThread.map((f: any) => (
                <div key={f.id} className="space-y-2">
                  <div className="bg-neutral-900 rounded-lg p-3">
                    {f.message && <div className="text-sm text-neutral-200">{f.message}</div>}
                    {f.image_url && (
                      <img src={f.image_url} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />
                    )}
                    <div className="text-[10px] text-neutral-600 mt-1.5">
                      {new Date(f.created_at).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                  {(f.coach_reply || f.coach_reply_image_url) && (
                    <div className="bg-mtrred/10 border border-mtrred/20 rounded-lg p-3 mr-4">
                      <div className="text-[10px] text-mtrgold mb-1">رد المدرب</div>
                      {f.coach_reply && <div className="text-sm text-neutral-200">{f.coach_reply}</div>}
                      {f.coach_reply_image_url && (
                        <img src={f.coach_reply_image_url} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-600 mt-8">MTR Team — نظام تتبع اللاعبين</div>
    </div>
  );
}

function PlayerChat({ player }: { player: any }) {
  const [messages, setMessages] = useState<{ role: string; content: string; imageUrl?: string }[]>([]);
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
        body: JSON.stringify({ playerId: player.id, messages: nextMessages, audience: "player" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col h-[420px]">
      <div className="text-sm font-semibold text-neutral-300 mb-3">اسأل مساعدك الذكي</div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-neutral-500 text-xs text-center py-8 leading-relaxed">
            اسأل أي حاجة عن تطورك — مثلاً: "إزاي أحسّن دفاع التيك داون بتاعي؟"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${m.role === "user" ? "bg-mtrred/20 mr-0 ml-auto text-right" : "bg-neutral-900 ml-0"}`}>
            {m.content}
            {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />}
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
