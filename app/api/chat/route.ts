import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import { generateRoadmapForPlayer } from "@/lib/roadmap-engine";

const MODEL = "llama-3.3-70b-versatile";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "log_skill_assessment",
      description: "سجّل تقييم رقمي لمهارة معينة عند اللاعب في النظام. استخدمها لما الكوتش يوصف أداء اللاعب في مهارة بعينها.",
      parameters: {
        type: "object",
        properties: {
          skillName: { type: "string", description: "اسم المهارة بالظبط زي ما ظاهر في قايمة المهارات المتاحة" },
          score: { type: "integer", description: "الدرجة من 1 إلى 10" },
        },
        required: ["skillName", "score"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_coach_note",
      description: "أضف ملاحظة نصية عن اللاعب (سلوك، إصابة، أداء عام، أي حاجة يستاهل تتسجل).",
      parameters: {
        type: "object",
        properties: { content: { type: "string" } },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_development_goal",
      description: "أضف هدف تطوير محدد بتاريخ مستهدف للاعب — مثلاً 'يتقن الـ Armbar من الجارد بحلول شهر معين'.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          targetDate: { type: "string", description: "تاريخ مستهدف بصيغة YYYY-MM-DD" },
        },
        required: ["title", "targetDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_meal_plan_item",
      description: "أضف وجبة لخطة اللاعب الغذائية — استخدمها لو الكوتش طلب منك تعمل نظام غذائي أو تضيف وجبة معينة وتحطها للاعب.",
      parameters: {
        type: "object",
        properties: {
          mealTime: { type: "string", description: "وقت الوجبة، مثلاً: الفطار، قبل التمرين، بعد التمرين، الغدا، العشا، سناك" },
          title: { type: "string", description: "عنوان الوجبة" },
          description: { type: "string", description: "تفاصيل المكونات والكميات" },
        },
        required: ["mealTime", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_exercise",
      description: "كلّف اللاعب بتمرين محدد — استخدمها لو الكوتش طلب منك تحط له تمارين أو واجب معين.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق YYYY-MM-DD (اختياري)" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_schedule_item",
      description: "أضف موعد تدريب لجدول اللاعب الأسبوعي.",
      parameters: {
        type: "object",
        properties: {
          dayOfWeek: { type: "string", description: "اليوم بالعربي: السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة" },
          timeLabel: { type: "string", description: "الساعة، مثلاً: 6 م (اختياري)" },
          activity: { type: "string", description: "النشاط، مثلاً: حصة سبارينج" },
        },
        required: ["dayOfWeek", "activity"],
      },
    },
  },
];

const OWNER_TOOLS = [
  {
    type: "function",
    function: {
      name: "broadcast_exercise",
      description: "وزّع تمرين واحد على مجموعة لاعبين أو على الكل مرة واحدة.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق YYYY-MM-DD (اختياري)" },
          players: {
            type: "array",
            items: { type: "string" },
            description: "أسماء اللاعبين المستهدفين، أو مصفوفة فيها كلمة واحدة 'ALL' لو عايز كل اللاعبين",
          },
        },
        required: ["title", "players"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "broadcast_meal",
      description: "وزّع وجبة أو نظام غذائي على مجموعة لاعبين أو على الكل.",
      parameters: {
        type: "object",
        properties: {
          mealTime: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          players: { type: "array", items: { type: "string" } },
        },
        required: ["mealTime", "title", "players"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "broadcast_note",
      description: "أضف نفس الملاحظة لمجموعة لاعبين أو للكل.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          players: { type: "array", items: { type: "string" } },
        },
        required: ["content", "players"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "broadcast_schedule_item",
      description: "أضف موعد تدريب لجدول مجموعة لاعبين أو للكل.",
      parameters: {
        type: "object",
        properties: {
          dayOfWeek: { type: "string" },
          timeLabel: { type: "string" },
          activity: { type: "string" },
          players: { type: "array", items: { type: "string" } },
        },
        required: ["dayOfWeek", "activity", "players"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "broadcast_goal",
      description: "أضف نفس هدف التطوير بتاريخ مستهدف لمجموعة لاعبين أو للكل.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          targetDate: { type: "string", description: "YYYY-MM-DD" },
          players: { type: "array", items: { type: "string" } },
        },
        required: ["title", "targetDate", "players"],
      },
    },
  },
];

async function resolveTargetPlayers(playersArg: any) {
  const { data: allPlayers } = await supabase.from("players").select("id, name").eq("approval_status", "APPROVED");
  const list = allPlayers || [];
  const names = Array.isArray(playersArg) ? playersArg : [playersArg];
  if (names.some((n: string) => n?.toUpperCase() === "ALL")) return list;
  return list.filter((p: any) => names.some((n: string) => p.name.toLowerCase().includes(String(n).toLowerCase())));
}

async function execOwnerTool(name: string, args: any) {
  const targets = await resolveTargetPlayers(args.players);
  if (targets.length === 0) return { ok: false, message: "مفيش لاعبين متطابقين مع الأسماء دي." };
  const names = targets.map((p: any) => p.name).join("، ");

  if (name === "broadcast_exercise") {
    await supabase.from("player_exercises").insert(
      targets.map((p: any) => ({ player_id: p.id, title: args.title, description: args.description || null, due_date: args.dueDate || null }))
    );
    return { ok: true, message: `اتضاف تمرين "${args.title}" لـ ${targets.length} لاعب: ${names}` };
  }

  if (name === "broadcast_meal") {
    await supabase.from("player_meals").insert(
      targets.map((p: any) => ({ player_id: p.id, meal_time: args.mealTime, title: args.title, description: args.description || null }))
    );
    return { ok: true, message: `اتضافت وجبة "${args.title}" لـ ${targets.length} لاعب: ${names}` };
  }

  if (name === "broadcast_note") {
    await supabase.from("player_notes").insert(
      targets.map((p: any) => ({ player_id: p.id, content: args.content, source: "AI" }))
    );
    return { ok: true, message: `اتضافت ملاحظة لـ ${targets.length} لاعب: ${names}` };
  }

  if (name === "broadcast_schedule_item") {
    await supabase.from("player_schedule").insert(
      targets.map((p: any) => ({ player_id: p.id, day_of_week: args.dayOfWeek, time_label: args.timeLabel || null, activity: args.activity }))
    );
    return { ok: true, message: `اتضاف للجدول لـ ${targets.length} لاعب: ${names}` };
  }

  if (name === "broadcast_goal") {
    await supabase.from("player_goals").insert(
      targets.map((p: any) => ({ player_id: p.id, title: args.title, description: args.description || null, target_date: args.targetDate, source: "AI" }))
    );
    return { ok: true, message: `اتضاف هدف "${args.title}" لـ ${targets.length} لاعب: ${names}` };
  }

  return { ok: false, message: "أداة غير معروفة." };
}

async function execTool(playerId: string, name: string, args: any) {
  if (name === "log_skill_assessment") {
    const { data: skill } = await supabase
      .from("skill_categories")
      .select("id, name")
      .ilike("name", `%${args.skillName}%`)
      .limit(1)
      .maybeSingle();
    if (!skill) return { ok: false, message: `مفيش مهارة اسمها "${args.skillName}" في النظام.` };

    await supabase.from("skill_assessments").insert({
      player_id: playerId,
      skill_category_id: skill.id,
      score: args.score,
      source: "AI",
    });
    await generateRoadmapForPlayer(playerId);
    return { ok: true, message: `اتسجّل تقييم "${skill.name}": ${args.score}/10` };
  }

  if (name === "add_coach_note") {
    await supabase.from("player_notes").insert({ player_id: playerId, content: args.content, source: "AI" });
    return { ok: true, message: "اتسجّلت الملاحظة." };
  }

  if (name === "add_development_goal") {
    await supabase.from("player_goals").insert({
      player_id: playerId,
      title: args.title,
      description: args.description || null,
      target_date: args.targetDate,
      source: "AI",
    });
    return { ok: true, message: `اتضاف هدف: "${args.title}" بتاريخ ${args.targetDate}` };
  }

  if (name === "add_meal_plan_item") {
    await supabase.from("player_meals").insert({
      player_id: playerId,
      meal_time: args.mealTime,
      title: args.title,
      description: args.description || null,
    });
    return { ok: true, message: `اتضافت وجبة "${args.title}" (${args.mealTime})` };
  }

  if (name === "assign_exercise") {
    await supabase.from("player_exercises").insert({
      player_id: playerId,
      title: args.title,
      description: args.description || null,
      due_date: args.dueDate || null,
    });
    return { ok: true, message: `اتكلّف اللاعب بتمرين: "${args.title}"` };
  }

  if (name === "add_schedule_item") {
    await supabase.from("player_schedule").insert({
      player_id: playerId,
      day_of_week: args.dayOfWeek,
      time_label: args.timeLabel || null,
      activity: args.activity,
    });
    return { ok: true, message: `اتضاف للجدول: "${args.activity}" يوم ${args.dayOfWeek}` };
  }

  return { ok: false, message: "أداة غير معروفة." };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY مش متضاف في إعدادات Vercel لسه." }, { status: 500 });
  }

  const { playerId, messages, audience } = await req.json();
  const canWrite = audience === "coach" && !!playerId;
  const ownerCanWrite = audience === "owner";

  let contextBlock = "";
  let skillNamesList = "";

  if (playerId) {
    const [{ data: player }, { data: assessments }, { data: roadmap }, { data: curriculum }, { data: notes }, { data: skillCats }] =
      await Promise.all([
        supabase.from("players").select("*").eq("id", playerId).single(),
        supabase.from("skill_assessments").select("score, date, skill_categories(name, domain)").eq("player_id", playerId).order("date", { ascending: false }),
        supabase.from("player_roadmap_items").select("title, recommendation, priority").eq("player_id", playerId).eq("status", "OPEN"),
        supabase.from("player_curriculum_progress").select("completed, curriculum_items(title)").eq("player_id", playerId),
        audience === "coach"
          ? supabase.from("player_notes").select("content, created_at").eq("player_id", playerId).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
        supabase.from("skill_categories").select("name"),
      ]);

    const latestPerSkill = new Map<string, { score: number; domain: string; name: string }>();
    (assessments || []).forEach((a: any) => {
      const name = a.skill_categories?.name;
      if (!name || latestPerSkill.has(name)) return;
      latestPerSkill.set(name, { score: a.score, domain: a.skill_categories?.domain, name });
    });

    skillNamesList = (skillCats || []).map((s: any) => s.name).join("، ");

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

المهارات المتاحة في النظام (استخدم الاسم بالظبط لما تسجّل تقييم): ${skillNamesList}
`.trim();
  } else if (audience === "owner") {
    const [{ data: players }, { data: openRoadmap }, { data: subs }] = await Promise.all([
      supabase.from("players").select("id, name, sport, current_belt, active").eq("approval_status", "APPROVED"),
      supabase.from("player_roadmap_items").select("player_id, priority").eq("status", "OPEN"),
      supabase.from("player_subscriptions").select("player_id, end_date, status").eq("status", "ACTIVE"),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const roadmapByPlayer: Record<string, number> = {};
    (openRoadmap || []).forEach((r: any) => { roadmapByPlayer[r.player_id] = (roadmapByPlayer[r.player_id] || 0) + 1; });
    const expiringSoon = (subs || []).filter((s: any) => {
      const days = (new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 7;
    });

    contextBlock = `
نظرة عامة على الفريق كله (مش لاعب واحد):
- إجمالي اللاعبين: ${(players || []).length}
- BJJ: ${(players || []).filter((p: any) => p.sport === "BJJ").length} · MMA: ${(players || []).filter((p: any) => p.sport === "MMA").length} · الاتنين: ${(players || []).filter((p: any) => p.sport === "BOTH").length}

لاعبين عندهم نقاط تطوير مفتوحة كتير (محتاجين متابعة):
${Object.entries(roadmapByPlayer).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([pid, count]) => {
  const p = (players || []).find((x: any) => x.id === pid);
  return `- ${p?.name || pid}: ${count} نقطة`;
}).join("\n") || "مفيش حد محتاج متابعة عاجلة"}

اشتراكات هتنتهي خلال أسبوع:
${expiringSoon.map((s: any) => {
  const p = (players || []).find((x: any) => x.id === s.player_id);
  return `- ${p?.name || s.player_id}: ${s.end_date}`;
}).join("\n") || "مفيش اشتراكات هتنتهي قريب"}

أسماء كل اللاعبين (استخدمها بالظبط لما تحدد لمين توزّع حاجة): ${(players || []).map((p: any) => p.name).join("، ")}
`.trim();
  }

  const toolsInstruction = canWrite
    ? `\n\nعندك أدوات (tools) تقدر تستخدمها لما الكوتش يطلب منك تسجّل حاجة فعليًا في النظام، مش بس تتكلم عنها: تسجيل تقييم مهارة برقم، إضافة ملاحظة، إضافة هدف تطوير بتاريخ، إضافة وجبة لخطة غذائية، تكليف اللاعب بتمرين، أو إضافة موعد لجدوله الأسبوعي. لو الكوتش قال حاجة زي "ابعتله كذا" أو "حط له خطة غذائية كذا" أو "كلّفه بالتمرين ده"، استخدم الأداة المناسبة على طول من غير ما تستأذن — الكوتش هيقدر يراجع ويعدّل أي حاجة تسجّلها يدويًا بعد كده من التابات التانية. متسجّلش حاجة لو الكلام عام أو مجرد سؤال.`
    : ownerCanWrite
    ? `\n\nعندك أدوات (tools) توزّع بيها تمرين أو وجبة أو ملاحظة أو موعد جدول أو هدف تطوير بتاريخ على أكتر من لاعب مرة واحدة. لو صاحب النظام قال "وزّع كذا على الكل" استخدم مصفوفة فيها "ALL" بس في خانة players. لو قال أسماء محددة، استخدم أسمائهم بالظبط زي ما هي في قايمة اللاعبين اللي وصلتك. استخدم الأداة على طول من غير ما تستأذن — هيقدر يراجع ويعدّل بعد كده لكل لاعب لوحده.`
    : "";

  const systemPrompt = `أنت مساعد ذكي متخصص في رياضتي الجوجيتسو (BJJ) والـ MMA، بتساعد ${
    audience === "owner" ? "صاحب النظام" : audience === "coach" ? "كوتش" : "لاعب"
  } في نظام تتبع تدريب اسمه MTR Team. ردودك دايمًا بالعربية المصرية العامية، مختصرة وعملية ومباشرة، مبنية على البيانات الفعلية اللي هتوصلك عن اللاعب. اقترح تمارين وخطط غذائية وتوصيات تقنية حقيقية ومحددة، مش كلام عام. لو البيانات ناقصة، قول كده صراحة بدل ما تختلق معلومات.${toolsInstruction}

${contextBlock}`;

  try {
    const body: any = {
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.5,
      max_tokens: 700,
    };
    if (canWrite) {
      body.tools = TOOLS;
      body.tool_choice = "auto";
    } else if (ownerCanWrite) {
      body.tools = OWNER_TOOLS;
      body.tool_choice = "auto";
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Groq error: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    const actionsTaken: string[] = [];

    const logIfPlayer = async (reply: string) => {
      if (audience !== "player" || !playerId) return;
      const lastUserMsg = messages[messages.length - 1];
      const rows = [];
      if (lastUserMsg?.role === "user") rows.push({ player_id: playerId, role: "user", content: lastUserMsg.content });
      rows.push({ player_id: playerId, role: "assistant", content: reply });
      await supabase.from("player_chat_logs").insert(rows);
    };

    if (choice?.tool_calls?.length) {
      const toolResultMessages = [];
      for (const call of choice.tool_calls) {
        let args: any = {};
        try { args = JSON.parse(call.function.arguments); } catch {}
        const result = ownerCanWrite
          ? await execOwnerTool(call.function.name, args)
          : await execTool(playerId, call.function.name, args);
        if (result.ok) actionsTaken.push(result.message);
        toolResultMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      const followUp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            choice,
            ...toolResultMessages,
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      });
      const followUpData = await followUp.json();
      const reply = followUpData.choices?.[0]?.message?.content || "تم.";
      await logIfPlayer(reply);
      return NextResponse.json({ reply, actionsTaken });
    }

    const reply = choice?.content || "معرفتش أرد دلوقتي، جرب تاني.";
    await logIfPlayer(reply);
    return NextResponse.json({ reply, actionsTaken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
