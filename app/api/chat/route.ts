import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/chat — coach or player assistant, grounded in the player's
// real data (roadmap, latest scores, curriculum progress). Uses Groq's
// free OpenAI-compatible API with an open-source model (Llama 3.3).
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY مش متضاف في إعدادات Vercel لسه." },
      { status: 500 }
    );
  }

  const { playerId, messages, audience } = await req.json();
  // audience: "coach" | "player" — controls whether private coach notes are included

  let contextBlock = "";

  if (playerId) {
    const [{ data: player }, { data: assessments }, { data: roadmap }, { data: curriculum }, { data: notes }] =
      await Promise.all([
        supabase.from("players").select("*").eq("id", playerId).single(),
        supabase.from("skill_assessments").select("score, date, skill_categories(name, domain)").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("player_roadmap_items").select("title, recommendation, priority").eq("player_id", playerId).eq("status", "OPEN"),
        supabase.from("player_curriculum_progress").select("completed, curriculum_items(title)").eq("player_id", playerId),
        audience === "coach"
          ? supabase.from("player_notes").select("content, created_at").eq("player_id", playerId).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
      ]);

    const latestPerSkill = new Map<string, { score: number; domain: string; name: string }>();
    (assessments || []).forEach((a: any) => {
      const name = a.skill_categories?.name;
      if (!name || latestPerSkill.has(name)) return;
      latestPerSkill.set(name, { score: a.score, domain: a.skill_categories?.domain, name });
    });

    contextBlock = `
بيانات اللاعب:
- الاسم: ${player?.name}
- الرياضة: ${player?.sport}
- الحزام: ${player?.current_belt}
- الوزن: ${player?.weight_kg} كجم

آخر تقييمات المهارات (من 10):
${Array.from(latestPerSkill.values()).map((s) => `- ${s.name} (${s.domain}): ${s.score}/10`).join("\n") || "لا يوجد تقييمات مسجّلة بعد"}

نقاط التطوير المفتوحة حاليًا:
${(roadmap || []).map((r: any) => `- [أولوية ${r.priority}] ${r.title}: ${r.recommendation}`).join("\n") || "لا يوجد نقاط ضعف مسجّلة"}

متطلبات الحزام:
${(curriculum || []).map((c: any) => `- ${c.completed ? "✅" : "⬜"} ${c.curriculum_items?.title}`).join("\n") || "لا يوجد بيانات"}
${audience === "coach" && notes && notes.length > 0 ? `\nملاحظات المدرب الأخيرة:\n${notes.map((n: any) => `- ${n.content}`).join("\n")}` : ""}
`.trim();
  }

  const systemPrompt = `أنت مساعد ذكي متخصص في رياضتي الجوجيتسو (BJJ) والـ MMA، بتساعد ${
    audience === "coach" ? "كوتش" : "لاعب"
  } في نظام تتبع تدريب اسمه MTR Team. ردودك دايمًا بالعربية المصرية العامية، مختصرة وعملية ومباشرة، مبنية على البيانات الفعلية اللي هتوصلك عن اللاعب. اقترح تمارين وخطط غذائية وتوصيات تقنية حقيقية ومحددة، مش كلام عام. لو البيانات ناقصة، قول كده صراحة بدل ما تختلق معلومات.

${contextBlock}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.6,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Groq error: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "معرفتش أرد دلوقتي، جرب تاني.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
