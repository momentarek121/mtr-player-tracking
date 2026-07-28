"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DOMAINS: Record<string, { label: string; color: string }> = {
  TECHNICAL: { label: "فني", color: "#C8102E" },
  TACTICAL: { label: "تكتيكي", color: "#D4A72C" },
  PHYSICAL: { label: "بدني", color: "#4A9B8E" },
  MENTAL: { label: "ذهني", color: "#8B7FD4" },
};

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};

export default function TeamDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team-dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">لوحة الفريق</div>
            <div className="text-[11px] text-neutral-500">نظرة شاملة على كل اللاعبين</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع للداشبورد
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="إجمالي اللاعبين" value={data.totalPlayers} />
        <StatCard label="BJJ" value={data.bySport.BJJ} />
        <StatCard label="MMA" value={data.bySport.MMA} />
        <StatCard label="الاتنين" value={data.bySport.BOTH} />
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-6">
        <div className="text-sm font-semibold text-neutral-300 mb-4">متوسط مستوى الفريق حسب المحور</div>
        {data.teamDomainAverages.length === 0 ? (
          <div className="text-neutral-500 text-xs text-center py-6">لسه مفيش تقييمات كفاية.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.teamDomainAverages.map((d: any) => (
              <div key={d.domain} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
                <div className="text-xs mb-1" style={{ color: DOMAINS[d.domain]?.color }}>{DOMAINS[d.domain]?.label}</div>
                <div className="text-xl font-bold">{d.average}</div>
                <div className="text-[10px] text-neutral-500">من 10</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-neutral-300 mb-1">لاعبين محتاجين متابعة</div>
        <div className="text-[11px] text-neutral-500 mb-4">مرتبين حسب عدد نقاط التطوير المفتوحة (الأولوية العالية الأول)</div>
        {data.playersNeedingAttention.length === 0 ? (
          <div className="text-neutral-500 text-xs text-center py-8">كل اللاعبين تمام دلوقتي 👏</div>
        ) : (
          <div className="space-y-2">
            {data.playersNeedingAttention.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-neutral-500">{p.sport} · حزام {BELT_LABELS[p.currentBelt]}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.highPriorityItems > 0 && (
                    <span className="bg-mtrred/15 border border-mtrred/40 text-red-300 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      {p.highPriorityItems} عاجل
                    </span>
                  )}
                  <span className="bg-neutral-800 text-neutral-300 text-[11px] font-medium px-2.5 py-1 rounded-full">
                    {p.openRoadmapItems} نقطة
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] text-neutral-500 mt-1">{label}</div>
    </div>
  );
}
