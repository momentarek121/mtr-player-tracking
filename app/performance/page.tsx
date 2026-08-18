"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCoachAuth } from "@/lib/useCoachAuth";

const BELT_LABELS: Record<string, string> = { WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود" };
const CATEGORY_LABELS: Record<string, string> = { STRENGTH: "قوة", CONDITIONING: "لياقة", MOBILITY: "مرونة", RECOVERY: "استشفاء", TEST: "اختبار" };

export default function PerformancePage() {
  const { loading: authLoading, coach, denied } = useCoachAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any[]>([]);
  const [weightLog, setWeightLog] = useState<any[]>([]);
  const [fightCamps, setFightCamps] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [itemMedia, setItemMedia] = useState<any[]>([]);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState("");
  const [mediaNote, setMediaNote] = useState("");
  const [mediaTimestamp, setMediaTimestamp] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programTitle, setProgramTitle] = useState("");
  const [programGoal, setProgramGoal] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("STRENGTH");
  const [exerciseSets, setExerciseSets] = useState("");
  const [exerciseReps, setExerciseReps] = useState("");
  const [exerciseLoad, setExerciseLoad] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatSending, setChatSending] = useState(false);

  const load = async () => {
    if (!coach?.id) return;
    setLoading(true);
    const res = await fetch(`/api/performance/workspace?coachId=${coach.id}`);
    const data = await res.json();
    setAssignments(data.assignments || []);
    setPlayers((data.assignments || []).map((a: any) => a.players).filter(Boolean));
    setAllPlayers(data.players || []);
    setPrograms(data.programs || []);
    setItems(data.items || []);
    setReadiness(data.readiness || []);
    setWeightLog(data.weightLog || []);
    setFightCamps(data.fightCamps || []);
    setAttachments(data.attachments || []);
    setItemMedia(data.itemMedia || []);
    if (!selectedPlayerId && data.assignments?.[0]?.player_id) setSelectedPlayerId(data.assignments[0].player_id);
    setLoading(false);
  };

  useEffect(() => { if (coach) load(); }, [coach]);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];
  const playerPrograms = useMemo(() => programs.filter((p) => p.player_id === selectedPlayer?.id), [programs, selectedPlayer]);
  const activeProgram = playerPrograms.find((p) => p.status === "ACTIVE") || playerPrograms[0];
  const programItems = items.filter((i) => i.program_id === activeProgram?.id);
  const playerReadiness = readiness.filter((r) => r.player_id === selectedPlayer?.id)[0];
  const playerWeightLog = weightLog.filter((w) => w.player_id === selectedPlayer?.id);
  const playerCamps = fightCamps.filter((c) => c.player_id === selectedPlayer?.id);
  const playerAttachments = attachments.filter((a) => a.player_id === selectedPlayer?.id);
  const currentPlayerIds = new Set(assignments.map((a) => a.player_id));

  const assignPlayer = async (playerId: string) => {
    if (!coach?.id || !playerId) return;
    setSaving(true);
    await fetch("/api/performance/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "assignment", coachId: coach.id, playerId, assignedBy: coach.id }) });
    setShowAssign(false); setSaving(false); await load(); setSelectedPlayerId(playerId);
  };
  const removePlayer = async () => {
    if (!coach?.id || !selectedPlayerId) return;
    setSaving(true);
    await fetch(`/api/performance/workspace?coachId=${coach.id}&playerId=${selectedPlayerId}`, { method: "DELETE" });
    setSelectedPlayerId(""); setSaving(false); await load();
  };
  const createProgram = async () => {
    if (!coach?.id || !selectedPlayer?.id || !programTitle.trim()) return;
    setSaving(true);
    await fetch("/api/performance/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coachId: coach.id, playerId: selectedPlayer.id, title: programTitle.trim(), goal: programGoal.trim() }) });
    setProgramTitle(""); setProgramGoal(""); setSaving(false); await load();
  };
  const addExercise = async () => {
    if (!activeProgram?.id || !exerciseName.trim()) return;
    setSaving(true);
    await fetch("/api/performance/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "item", coachId: coach?.id, programId: activeProgram.id, exerciseName: exerciseName.trim(), category: exerciseCategory, sets: exerciseSets, reps: exerciseReps, load: exerciseLoad }) });
    setExerciseName(""); setExerciseSets(""); setExerciseReps(""); setExerciseLoad(""); setSaving(false); await load();
  };
  const sendChat = async () => {
    if (!chatInput.trim() || chatSending) return;
    const userMessage = { role: "user", content: chatInput.trim() };
    const next = [...chatMessages, userMessage];
    setChatMessages(next); setChatInput(""); setChatSending(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience: "performance", coachId: coach?.id, messages: next }) });
    const data = await res.json();
    setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "حصل خطأ" }]);
    setChatSending(false);
  };
  const linkMedia = async (itemId: string) => {
    if (!coach?.id || !selectedAttachmentId) return;
    await fetch("/api/performance/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "media", coachId: coach.id, itemId, attachmentId: selectedAttachmentId, timestampSec: mediaTimestamp ? Number(mediaTimestamp) : null, note: mediaNote || null }) });
    setMediaNote(""); setMediaTimestamp(""); await load();
  };
  const toggleItem = async (item: any) => {
    await fetch("/api/performance/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "item", coachId: coach?.id, itemId: item.id, completed: !item.completed }) });
    await load();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحقق...</div>;
  if (denied) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">مفيش صلاحية وصول.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري تحميل Workspace المدرب البدني...</div>;

  return <div dir="rtl" className="min-h-screen bg-black text-white p-4 md:p-8">
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-mtrred flex items-center justify-center font-bold">MTR</div><div><div className="text-xl font-semibold">Workspace المدرب البدني</div><div className="text-xs text-neutral-500">{coach?.name} · لاعبوك وبرامجهم في مكان واحد</div></div></div>
        <div className="flex gap-2"><Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2">لوحة الفريق</Link><button onClick={() => { setShowAssign(true); }} className="text-xs bg-mtrred rounded-lg px-3 py-2 font-semibold">+ اختيار لاعب</button><button onClick={() => setChatOpen(true)} className="text-xs border border-neutral-700 rounded-lg px-3 py-2">شات المدرب البدني</button></div>
      </header>

      {chatOpen && <div className="fixed inset-0 z-20 bg-black/70 flex items-end md:items-center justify-center p-4"><div className="w-full max-w-xl bg-neutral-950 border border-neutral-700 rounded-2xl p-4"><div className="flex items-center justify-between mb-3"><div><div className="text-sm font-semibold">شات المدرب البدني</div><div className="text-[11px] text-neutral-500">اسأل عن توزيع الحمل، التمرين، الجاهزية، أو لاعبيك.</div></div><button onClick={() => setChatOpen(false)} className="text-xs text-neutral-500">إغلاق</button></div><div className="h-64 overflow-y-auto space-y-2 mb-3">{chatMessages.length === 0 && <div className="text-xs text-neutral-600 text-center py-10">مثال: مين من لاعبيي محتاج تركيز على القوة؟</div>}{chatMessages.map((m, i) => <div key={i} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-mtrred/15 mr-8" : "bg-neutral-900 ml-8 text-neutral-300"}`}>{m.content}</div>)}</div><div className="flex gap-2"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="اكتب سؤالك..." className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs" /><button onClick={sendChat} disabled={chatSending} className="bg-mtrred rounded-lg px-4 text-xs font-semibold">{chatSending ? "..." : "إرسال"}</button></div></div></div>}

      {showAssign && <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-5"><div className="flex items-center justify-between mb-3"><div className="text-sm font-semibold">اختار لاعبًا لإسناده لك</div><button onClick={() => setShowAssign(false)} className="text-xs text-neutral-500">إغلاق</button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{allPlayers.filter((p) => !currentPlayerIds.has(p.id)).map((p) => <button key={p.id} onClick={() => assignPlayer(p.id)} className="text-right bg-neutral-900 border border-neutral-800 hover:border-mtrred rounded-lg p-3"><div className="text-sm">{p.name}</div><div className="text-[11px] text-neutral-500">{p.player_code} · {p.sport} · {p.weight_kg} كجم</div></button>)}{allPlayers.filter((p) => !currentPlayerIds.has(p.id)).length === 0 && <div className="text-xs text-neutral-500">كل اللاعبين متسندين لك بالفعل.</div>}</div></div>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <aside className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 h-fit"><div className="text-xs text-neutral-500 px-2 pb-2">لاعبي المدرب البدني ({players.length})</div>{players.map((p) => <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={`w-full text-right rounded-lg p-3 mb-1 ${selectedPlayer?.id === p.id ? "bg-mtrred/15 border border-mtrred/40" : "hover:bg-neutral-900"}`}><div className="text-sm font-medium">{p.name}</div><div className="text-[11px] text-neutral-500">{p.player_code} · {p.sport}</div></button>)}{players.length === 0 && <div className="text-xs text-neutral-500 text-center py-6">اختار أول لاعب للبدء.</div>}</aside>

        <main className="space-y-5">{selectedPlayer ? <>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex items-center justify-between gap-3"><div><div className="text-lg font-semibold">{selectedPlayer.name}</div><div className="text-xs text-neutral-500 mt-1">{selectedPlayer.player_code} · {selectedPlayer.sport} · حزام {BELT_LABELS[selectedPlayer.current_belt]} · {selectedPlayer.weight_kg} كجم</div></div><button onClick={removePlayer} disabled={saving} className="text-xs text-neutral-500 hover:text-red-400">إزالة من قائمتي</button></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Metric label="البرامج" value={playerPrograms.length} /><Metric label="تمارين نشطة" value={programItems.filter((i) => !i.completed).length} /><Metric label="تمارين مكتملة" value={programItems.filter((i) => i.completed).length} /><Metric label="الوزن" value={`${selectedPlayer.weight_kg || "—"} كجم`} /></div>
          <div className="grid md:grid-cols-2 gap-4"><div className="bg-neutral-950 border border-violet-700/30 rounded-xl p-4"><div className="text-sm font-semibold mb-2">الجاهزية الأخيرة</div>{playerReadiness ? <div className="grid grid-cols-3 gap-2 text-center"><MiniMetric label="نوم" value={`${playerReadiness.sleep_quality}/5`} /><MiniMetric label="طاقة" value={`${playerReadiness.energy}/5`} /><MiniMetric label="إجهاد" value={`${playerReadiness.soreness}/5`} /></div> : <div className="text-xs text-neutral-500">لا توجد قراءة جاهزية بعد.</div>}</div><div className="bg-neutral-950 border border-mtrgold/30 rounded-xl p-4"><div className="text-sm font-semibold mb-2">المتابعة المرتبطة</div><div className="text-xs text-neutral-400">{playerCamps.length} معسكر نشط · {playerWeightLog.length} قياس وزن · {playerAttachments.length} وسائط</div><div className="text-[11px] text-neutral-600 mt-2">استخدم هذه المؤشرات لتعديل الحمل قبل الحصة التالية.</div></div></div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3"><div><div className="text-sm font-semibold">إنشاء برنامج أداء بدني</div><div className="text-[11px] text-neutral-500 mt-1">برنامج خاص باللاعب، منفصل عن خطة الجوجيتسو والتكتيك.</div></div><div className="grid md:grid-cols-2 gap-2"><input value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} placeholder="اسم البرنامج (مثلاً: Strength Block 1)" className="bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs" /><input value={programGoal} onChange={(e) => setProgramGoal(e.target.value)} placeholder="الهدف (قوة، تحمل، خفض وزن...)" className="bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-xs" /></div><button onClick={createProgram} disabled={saving || !programTitle.trim()} className="bg-mtrred rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-40">إنشاء البرنامج</button></div>
          {activeProgram && <div className="bg-neutral-950 border border-mtrred/30 rounded-xl p-5 space-y-4"><div className="flex items-start justify-between"><div><div className="text-base font-semibold">{activeProgram.title}</div><div className="text-xs text-neutral-500 mt-1">{activeProgram.goal || "بدون هدف محدد"}</div></div><span className="text-[10px] text-green-400 bg-green-400/10 rounded-full px-2 py-1">{activeProgram.status}</span></div><div className="grid md:grid-cols-[1fr_120px_100px_100px_auto] gap-2"><input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} placeholder="اسم التمرين" className="bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs" /><select value={exerciseCategory} onChange={(e) => setExerciseCategory(e.target.value)} className="bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs">{Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><input value={exerciseSets} onChange={(e) => setExerciseSets(e.target.value)} placeholder="Sets" className="bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs" /><input value={exerciseReps} onChange={(e) => setExerciseReps(e.target.value)} placeholder="Reps" className="bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs" /><button onClick={addExercise} disabled={saving || !exerciseName.trim()} className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 text-xs">إضافة</button></div><div className="flex flex-wrap gap-2 items-center bg-neutral-900/70 rounded-lg p-2"><select value={selectedAttachmentId} onChange={(e) => setSelectedAttachmentId(e.target.value)} className="flex-1 min-w-[180px] bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs"><option value="">اختار صورة أو فيديو لربطه بتمرين</option>{playerAttachments.map((a: any) => <option key={a.id} value={a.id}>{a.file_name || a.caption || a.file_type}</option>)}</select><input value={mediaTimestamp} onChange={(e) => setMediaTimestamp(e.target.value)} placeholder="ثانية" type="number" className="w-20 bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs" /><input value={mediaNote} onChange={(e) => setMediaNote(e.target.value)} placeholder="ملاحظة المراجعة" className="flex-1 min-w-[150px] bg-black border border-neutral-700 rounded-lg px-2 py-2 text-xs" /></div><div className="space-y-2">{programItems.map((item) => <div key={item.id} className="bg-neutral-900 rounded-lg px-3 py-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={item.completed} onChange={() => toggleItem(item)} className="accent-mtrred" /><span className={`text-sm ${item.completed ? "line-through text-neutral-600" : "text-neutral-200"}`}>{item.exercise_name}</span><span className="text-[10px] text-neutral-500 mr-auto">{CATEGORY_LABELS[item.category] || item.category} {item.sets ? `· ${item.sets} sets` : ""} {item.reps ? `· ${item.reps} reps` : ""}</span><button type="button" onClick={() => linkMedia(item.id)} disabled={!selectedAttachmentId} className="text-[10px] text-teal-400 disabled:text-neutral-700">ربط الدليل</button></label>{itemMedia.filter((m: any) => m.item_id === item.id).map((m: any) => <div key={m.id} className="text-[10px] text-neutral-500 mr-7 mt-1">↳ {m.player_attachments?.file_name || "دليل"}{m.timestamp_sec !== null ? ` · ${m.timestamp_sec}s` : ""}{m.note ? ` · ${m.note}` : ""}</div>)}</div>)}{programItems.length === 0 && <div className="text-xs text-neutral-500 text-center py-5">أضف أول تمرين للبرنامج.</div>}</div></div>}
          {!activeProgram && <div className="bg-neutral-950 border border-dashed border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">لم يتم إنشاء برنامج لهذا اللاعب بعد.</div>}
        </> : <div className="bg-neutral-950 border border-dashed border-neutral-800 rounded-xl p-12 text-center text-sm text-neutral-500">اختار لاعبًا من القائمة أو أضف لاعبًا جديدًا.</div>}</main>
      </div>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3"><div className="text-[11px] text-neutral-500">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="bg-neutral-900 rounded-lg px-2 py-2"><div className="text-[10px] text-neutral-500">{label}</div><div className="text-sm font-semibold mt-1">{value}</div></div>; }
