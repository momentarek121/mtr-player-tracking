"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message || "حصل خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-sm font-semibold">دخول المدربين</div>
            <div className="text-[11px] text-neutral-500">للوصول إلى داشبورد الإدارة</div>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-semibold mb-4"
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

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full bg-mtrred rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {loading ? "..." : "دخول"}
        </button>

        <div className="text-[11px] text-neutral-600 mt-4 text-center">
          الوصول متاح فقط للمدربين المضافين مسبقًا. محتاج حساب Supabase Auth بالإيميل ده أولًا (Sign up)، وبعدين إضافتك كمدرب.
        </div>
      </div>
    </div>
  );
}
