"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "code">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playerCode, setPlayerCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setInfo(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/me` },
        });
        if (err) throw err;
        setInfo("اتبعتلك رسالة تأكيد على الإيميل — افتحها وبعدين ارجع سجل دخول.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = "/me";
      }
    } catch (e: any) {
      setError(e.message || "حصل خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeAccess = async () => {
    setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("players")
        .select("id")
        .eq("player_code", playerCode.trim().toUpperCase())
        .maybeSingle();
      if (err) throw err;
      if (!data) { setError("الكود ده مش موجود، تأكد منه مع المدرب."); setLoading(false); return; }
      window.location.href = `/player/${data.id}`;
    } catch (e: any) {
      setError(e.message || "حصل خطأ");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/me` },
    });
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div className="text-sm font-semibold">دخول اللاعبين</div>
        </div>

        <div className="flex gap-1.5 mb-5 bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition ${mode === "login" ? "bg-mtrred text-white" : "text-neutral-400"}`}
          >
            دخول
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition ${mode === "signup" ? "bg-mtrred text-white" : "text-neutral-400"}`}
          >
            حساب جديد
          </button>
          <button
            onClick={() => setMode("code")}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition ${mode === "code" ? "bg-mtrred text-white" : "text-neutral-400"}`}
          >
            بالكود
          </button>
        </div>

        {mode === "code" ? (
          <>
            <div className="text-[11px] text-neutral-500 mb-3">
              لو المدرب أعطاك كود شخصي بالفعل (زي MOH-4821)، ادخل بيه على طول من غير حساب.
            </div>
            <input
              value={playerCode}
              onChange={(e) => setPlayerCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCodeAccess()}
              placeholder="اكتب كودك"
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-4 text-center font-mono tracking-wider"
            />
            {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
            <button
              onClick={handleCodeAccess}
              disabled={loading || !playerCode.trim()}
              className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {loading ? "..." : "دخول"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-semibold mb-4 flex items-center justify-center gap-2"
            >
              الدخول بحساب Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-[11px] text-neutral-600">أو بالإيميل</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="الإيميل"
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-3"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة السر"
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm mb-4"
            />

            {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
            {info && <div className="text-green-400 text-xs mb-3">{info}</div>}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {loading ? "..." : mode === "signup" ? "إنشاء حساب" : "دخول"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
