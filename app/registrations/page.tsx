"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

export default function RegistrationsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("approval_status", "PENDING")
      .order("created_at", { ascending: false });
    setPending(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await supabase.from("players").update({ approval_status: "APPROVED" }).eq("id", id);
    load();
  };

  const reject = async (id: string) => {
    if (!confirm("متأكد إنك عايز ترفض وتمسح التسجيل ده؟")) return;
    await supabase.from("players").delete().eq("id", id);
    load();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">طلبات التسجيل</div>
            <div className="text-[11px] text-neutral-500">لاعبين سجّلوا بنفسهم وبانتظار موافقتك</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع للداشبورد
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
          مفيش طلبات تسجيل جديدة حاليًا.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-neutral-500">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : "صورة"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {p.player_code} · {p.sport} · حزام {BELT_LABELS[p.current_belt]} · {p.weight_kg} كجم
                </div>
              </div>
              <button onClick={() => approve(p.id)} className="bg-mtrred rounded-lg px-3 py-2 text-xs font-semibold shrink-0">
                قبول
              </button>
              <button onClick={() => reject(p.id)} className="text-neutral-500 hover:text-red-400 text-xs shrink-0">
                رفض
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
