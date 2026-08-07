"use client";

import { useState } from "react";
import Link from "next/link";
import { useCoachAuth } from "@/lib/useCoachAuth";

export default function OwnerChatPage() {
  const { loading: authLoading, coach, denied } = useCoachAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const isOwner = coach?.role === "ADMIN";

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, audience: "owner" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">جاري التحقق...</div>;
  if (denied) return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">مفيش صلاحية وصول.</div>;
  if (!isOwner) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-sm text-center">
          <div className="text-lg font-semibold mb-2">🔒 خاص بصاحب النظام</div>
          <div className="text-sm text-neutral-400 leading-relaxed">الشات ده متاح بس لحساب الأدمن الأساسي.</div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-10 max-w-2xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mtrred flex items-center justify-center font-bold text-sm">MTR</div>
          <div>
            <div className="text-lg font-semibold">شات صاحب النظام</div>
            <div className="text-[11px] text-neutral-500">نظرة شاملة على كل الفريق — مش لاعب واحد</div>
          </div>
        </div>
        <Link href="/" className="text-xs text-neutral-400 border border-neutral-700 rounded-lg px-3 py-2 hover:border-neutral-500 transition">
          ← رجوع
        </Link>
      </div>

      <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 && (
            <div className="text-neutral-500 text-xs text-center py-10 leading-relaxed">
              مثلاً: "مين اللاعبين محتاجين متابعة دلوقتي؟" أو "فيه اشتراكات هتخلص قريب؟"
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${m.role === "user" ? "bg-mtrred/20 mr-0 ml-auto text-right" : "bg-neutral-900 ml-0"}`}>
              {m.content}
            </div>
          ))}
          {sending && <div className="text-neutral-500 text-xs">بيفكر...</div>}
          {error && <div className="text-red-400 text-xs">{error}</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="اسأل عن الفريق كله..."
            className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-sm"
          />
          <button onClick={send} disabled={sending} className="bg-mtrred rounded-lg px-4 text-sm font-semibold disabled:opacity-40">
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
