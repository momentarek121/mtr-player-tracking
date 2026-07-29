"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BELT_LABELS: Record<string, string> = {
  WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود",
};
const BELTS = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"];

export default function MePage() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("2000-01-01");
  const [sport, setSport] = useState("BJJ");
  const [belt, setBelt] = useState("WHITE");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    let settled = false;

    const loadForUser = async (u: any) => {
      if (settled) return;
      settled = true;
      setUser(u);
      const { data: p } = await supabase.from("players").select("*").eq("auth_user_id", u.id).maybeSingle();
      if (p) {
        setPlayer(p);
        setName(p.name); setDob(p.dob); setSport(p.sport); setBelt(p.current_belt); setWeight(p.weight_kg?.toString() || "");
      }
      setLoading(false);
    };

    // Listen for the auth event first — this fires reliably once Supabase
    // finishes parsing the OAuth redirect (avoids a race where getUser()
    // is checked before the session from Google has been established).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) loadForUser(session.user);
    });

    // Also check immediately in case a session already exists (e.g. a
    // normal page refresh, not a fresh OAuth redirect).
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        loadForUser(session.user);
      } else {
        // Give the OAuth redirect a moment to finish before giving up.
        setTimeout(async () => {
          if (settled) return;
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2?.user) {
            loadForUser(s2.user);
          } else {
            settled = true;
            window.location.href = "/login";
          }
        }, 1500);
      }
    })();

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const save = async () => {
    if (!user || !name.trim() || !weight) return;
    setSaving(true);
    const payload = { name: name.trim(), dob, sport, current_belt: belt, weight_kg: Number(weight), auth_user_id: user.id };

    if (player) {
      const { data } = await supabase.from("players").update(payload).eq("id", player.id).select().single();
      setPlayer(data);
    } else {
      let created = null;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        const base = (name.trim().split(" ")[0] || "PLR").replace(/[^a-zA-Zء-ي]/g, "").toUpperCase().slice(0, 4) || "PLR";
        const code = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data, error } = await supabase.from("players").insert({ ...payload, player_code: code, approval_status: "PENDING" }).select().single();
        if (!error) created = data;
        else if (!error.message.includes("player_code")) break;
      }
      setPlayer(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const uploadAvatar = async (file: File) => {
    if (!player) return;
    const path = `${player.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("player-photos").upload(path, file);
    if (upErr) { alert("فشل الرفع: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("player-photos").getPublicUrl(path);
    const { data } = await supabase.from("players").update({ photo_url: pub.publicUrl }).eq("id", player.id).select().single();
    setPlayer(data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-sm font-semibold">حسابك</div>
            <div className="text-[11px] text-neutral-500">{user?.email}</div>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-neutral-500 hover:text-neutral-300 transition">تسجيل خروج</button>
      </div>

      {!player && (
        <div className="bg-mtrred/10 border border-mtrred/30 text-red-200 text-xs rounded-lg px-4 py-3 mb-5">
          مرحبًا! كمّل بياناتك تحت عشان الكوتش يقدر يشوفك ويبدأ يتابع تطورك.
        </div>
      )}

      {player && player.approval_status === "PENDING" && (
        <div className="bg-mtrgold/10 border border-mtrgold/30 text-yellow-200 text-xs rounded-lg px-4 py-3 mb-5">
          ⏳ بياناتك اتحفظت وبانتظار موافقة المدرب — هتقدر تستخدم كل حاجة عادي، بس هيبان للمدرب في قايمة "طلبات التسجيل" لحد ما يقبلك.
        </div>
      )}

      {player && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4 text-center">
          <div className="text-[11px] text-neutral-500">كودك الشخصي</div>
          <div className="text-sm font-mono font-semibold text-mtrgold">{player.player_code}</div>
        </div>
      )}

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mb-5">
        {player && (
          <label className="relative w-20 h-20 rounded-xl bg-neutral-800 border border-neutral-700 mb-4 cursor-pointer overflow-hidden flex items-center justify-center text-[11px] text-neutral-500 mx-auto">
            {player.photo_url ? <img src={player.photo_url} alt="" className="w-full h-full object-cover" /> : "صورتك"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </label>
        )}

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

        <label className="block text-xs text-neutral-400 mb-1.5">الحزام الحالي</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BELTS.map((b) => (
            <button key={b} onClick={() => setBelt(b)} className={`px-3 py-1.5 rounded-md text-xs border ${belt === b ? "bg-mtrred border-mtrred" : "border-neutral-700 text-neutral-400"}`}>{BELT_LABELS[b]}</button>
          ))}
        </div>

        <label className="block text-xs text-neutral-400 mb-1.5">الوزن (كجم)</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm mb-5" />

        <button
          onClick={save}
          disabled={saving || !name.trim() || !weight}
          className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {saving ? "..." : saved ? "✓ اتحفظ" : player ? "حفظ التعديلات" : "إنشاء بروفايلي"}
        </button>
      </div>

      {player && (
        <a
          href={`/player/${player.id}`}
          className="block text-center bg-neutral-900 border border-neutral-700 rounded-xl py-3 text-sm font-medium hover:border-neutral-500 transition"
        >
          شوف تطورك الكامل وتماريتك 📊
        </a>
      )}
    </div>
  );
}
