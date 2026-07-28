"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-mtrred text-white" : "text-neutral-400"}`}
          >
            تسجيل دخول
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "signup" ? "bg-mtrred text-white" : "text-neutral-400"}`}
          >
            حساب جديد
          </button>
        </div>

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
      </div>
    </div>
  );
}
