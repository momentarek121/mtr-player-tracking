"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCoachAuth } from "@/lib/useCoachAuth";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "أدمن",
  HEAD_COACH: "كوتش رئيسي",
  COACH: "كوتش",
  PERFORMANCE_COACH: "كوتش أداء بدني",
};

export default function CoachesPage() {
  const { loading: authLoading, coach, denied } = useCoachAuth();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("COACH");

  const load = async () => {
    const { data } = await supabase.from("coaches").select("*").order("created_at");
    setCoaches(data || []);
    setLoading(false);
  };

  useEffect(() => { if (coach) load(); }, [coach]);

  const canManage = coach?.role === "ADMIN" || coach?.role === "HEAD_COACH";

  const addCoach = async () => {
    if (!newEmail.trim() || !newName.trim()) return;
    await supabase.from("coaches").insert({ email: newEmail.trim(), name: newName.trim(), role: newRole });
    setNewEmail(""); setNewName("");
    load();
  };

  const removeCoach = async (id: string) => {
    if (id === coach.id) { alert("مينفعش تمسح نفسك."); return; }
    if (!confirm("متأكد إنك عايز تشيل صلاحية المدرب ده؟")) return;
    await supabase.from("coaches").delete().eq("id", id);
    load();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحقق...</div>;
  if (denied) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">مفيش صلاحية وصول.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">إدارة المدربين</div>
            <div className="text-[11px] text-neutral-500">مين عنده صلاحية الدخول على الداشبورد</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع
        </Link>
      </div>

      {canManage && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-5">
          <div className="text-sm font-semibold text-neutral-300 mb-3">إضافة مدرب جديد</div>
          <div className="text-[11px] text-neutral-500 mb-3">
            ضيف الإيميل هنا الأول — المدرب الجديد لازم يعمل حساب (Sign up) بنفس الإيميل ده من صفحة دخول المدربين، وهيتفعّل تلقائي.
          </div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="الاسم" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-2" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="الإيميل" className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-2" />
          <div className="flex gap-1.5 mb-3">
            {Object.entries(ROLE_LABELS).map(([r, l]) => (
              <button key={r} onClick={() => setNewRole(r)} className={`px-3 py-1.5 rounded-md text-xs border ${newRole === r ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{l}</button>
            ))}
          </div>
          <button onClick={addCoach} className="bg-mtrred rounded-lg px-4 py-2 text-sm font-semibold">إضافة</button>
        </div>
      )}

      <div className="space-y-2">
        {coaches.map((c) => (
          <div key={c.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{c.name} {c.id === coach.id && <span className="text-neutral-600 text-xs">(إنت)</span>}</div>
              <div className="text-[11px] text-neutral-500">{c.email} · {ROLE_LABELS[c.role] || c.role}</div>
            </div>
            {canManage && c.id !== coach.id && (
              <button onClick={() => removeCoach(c.id)} className="text-neutral-500 hover:text-red-400 text-xs">حذف</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
