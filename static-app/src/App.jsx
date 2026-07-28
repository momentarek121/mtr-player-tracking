import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, User, X, ChevronRight, Trophy } from "lucide-react";

// ---------------------------------------------------------------
// Live Supabase project (mtr-player-tracking) — talks directly to
// Postgres via the REST (PostgREST) API using the public anon key.
// RLS is currently open ("allow all") for testing — tighten before
// handing this out beyond the team.
// ---------------------------------------------------------------
const SUPABASE_URL = "https://bvoopymudmupahkovidd.supabase.co";
const ANON_KEY = "sb_publishable_9ihlZrrnugOPj6Q-4AqKdQ_PHt66YLe";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method && options.method !== "GET" ? "return=representation" : undefined,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const DOMAINS = {
  TECHNICAL: { label: "فني", color: "#C8102E" },
  TACTICAL: { label: "تكتيكي", color: "#D4A72C" },
  PHYSICAL: { label: "بدني", color: "#4A9B8E" },
  MENTAL: { label: "ذهني", color: "#8B7FD4" },
};

const BELTS = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"];
const BELT_LABELS = { WHITE: "أبيض", BLUE: "أزرق", PURPLE: "بنفسجي", BROWN: "بني", BLACK: "أسود" };
const BELT_COLORS = { WHITE: "#F5F5F0", BLUE: "#3B6FD4", PURPLE: "#7B4FD4", BROWN: "#6B4A2E", BLACK: "#1A1A1C" };

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso) => iso.slice(0, 7);

// ---------------------------------------------------------------
export default function App() {
  const [players, setPlayers] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState(null);

  const loadPlayers = useCallback(async () => {
    const data = await sb("players?select=*&order=name.asc");
    setPlayers(data || []);
    return data || [];
  }, []);

  const loadSkillCategories = useCallback(async () => {
    const data = await sb("skill_categories?select=*&order=domain.asc");
    setSkillCategories(data || []);
  }, []);

  const loadPlayerData = useCallback(async (playerId) => {
    const [a, r] = await Promise.all([
      sb(`skill_assessments?player_id=eq.${playerId}&select=*,skill_categories(name,domain)&order=date.desc`),
      sb(`player_roadmap_items?player_id=eq.${playerId}&status=eq.OPEN&select=*&order=priority.asc`),
    ]);
    setAssessments(a || []);
    setRoadmap(r || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [ps] = await Promise.all([loadPlayers(), loadSkillCategories()]);
        if (ps.length > 0) setSelectedId(ps[0].id);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPlayers, loadSkillCategories]);

  useEffect(() => {
    if (selectedId) loadPlayerData(selectedId).catch((e) => setError(e.message));
  }, [selectedId, loadPlayerData]);

  const addPlayer = async (player) => {
    try {
      const [created] = await sb("players", {
        method: "POST",
        body: JSON.stringify({
          name: player.name,
          dob: player.dob,
          weight_kg: player.weightKg,
          sport: player.sport,
          current_belt: player.currentBelt,
        }),
      });
      await loadPlayers();
      setSelectedId(created.id);
      setShowAddPlayer(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const addAssessment = async (skillCategoryId, score, date) => {
    if (!selectedId) return;
    try {
      await sb("skill_assessments", {
        method: "POST",
        body: JSON.stringify({ player_id: selectedId, skill_category_id: skillCategoryId, score, date }),
      });
      await generateRoadmap(selectedId);
      await loadPlayerData(selectedId);
    } catch (e) {
      setError(e.message);
    }
  };

  // Client-side roadmap engine — mirrors the server logic: latest score
  // per skill vs. active rule thresholds, open/resolve items accordingly.
  const generateRoadmap = async (playerId) => {
    const [latestAssessments, rules, existingOpen] = await Promise.all([
      sb(`skill_assessments?player_id=eq.${playerId}&select=skill_category_id,score,date&order=date.desc`),
      sb("roadmap_rules?active=eq.true&select=*,skill_categories(name)"),
      sb(`player_roadmap_items?player_id=eq.${playerId}&status=eq.OPEN&select=*`),
    ]);

    const latestPerSkill = new Map();
    (latestAssessments || []).forEach((a) => {
      if (!latestPerSkill.has(a.skill_category_id)) latestPerSkill.set(a.skill_category_id, a.score);
    });

    const triggered = [];
    for (const rule of rules || []) {
      const score = latestPerSkill.get(rule.skill_category_id);
      if (score !== undefined && score < rule.score_below) triggered.push(rule);
    }

    const existingRuleIds = new Set((existingOpen || []).map((i) => i.rule_id));
    const toCreate = triggered.filter((r) => !existingRuleIds.has(r.id));

    if (toCreate.length > 0) {
      await sb("player_roadmap_items", {
        method: "POST",
        body: JSON.stringify(
          toCreate.map((r) => ({
            player_id: playerId,
            rule_id: r.id,
            title: `${r.skill_categories?.name}: ${r.name}`,
            recommendation: r.recommendation,
            priority: r.priority,
          }))
        ),
      });
    }

    const triggeredIds = new Set(triggered.map((r) => r.id));
    const toResolve = (existingOpen || []).filter((i) => i.rule_id && !triggeredIds.has(i.rule_id));
    for (const item of toResolve) {
      await sb(`player_roadmap_items?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED", resolved_at: new Date().toISOString() }),
      });
    }
  };

  const selectedPlayer = players.find((p) => p.id === selectedId) || null;

  if (loading) {
    return (
      <div style={{ background: "#0B0B0D", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8B8B8F", fontFamily: "monospace", fontSize: 13 }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={styles.app}>
      <style>{fontImports}</style>
      <Sidebar players={players} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setTab("overview"); }} onAddClick={() => setShowAddPlayer(true)} />
      <main style={styles.main}>
        {error && <div style={styles.errorBanner}>{error}</div>}
        {!selectedPlayer ? (
          <EmptyState onAddClick={() => setShowAddPlayer(true)} />
        ) : (
          <PlayerProfile
            player={selectedPlayer}
            assessments={assessments}
            skillCategories={skillCategories}
            roadmap={roadmap}
            tab={tab}
            setTab={setTab}
            onAddAssessment={addAssessment}
          />
        )}
      </main>
      {showAddPlayer && <AddPlayerModal onClose={() => setShowAddPlayer(false)} onSave={addPlayer} />}
    </div>
  );
}

const fontImports = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

function Sidebar({ players, selectedId, onSelect, onAddClick }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>MTR</div>
        <div>
          <div style={styles.brandTitle}>نظام تتبع اللاعبين</div>
          <div style={styles.brandSub}>متصل بقاعدة بيانات حقيقية</div>
        </div>
      </div>
      <button style={styles.addPlayerBtn} onClick={onAddClick}><Plus size={16} /> إضافة لاعب</button>
      <div style={styles.playerList}>
        {players.length === 0 && <div style={styles.noPlayers}>مفيش لاعبين لسه — ابدأ بإضافة أول لاعب.</div>}
        {players.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)} style={{ ...styles.playerRow, ...(p.id === selectedId ? styles.playerRowActive : {}) }}>
            <div style={{ ...styles.beltDot, background: BELT_COLORS[p.current_belt] }} />
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={styles.playerName}>{p.name}</div>
              <div style={styles.playerMeta}>{p.sport} · حزام {BELT_LABELS[p.current_belt]}</div>
            </div>
            <ChevronRight size={14} color="#5A5A5E" style={{ transform: "rotate(180deg)" }} />
          </button>
        ))}
      </div>
    </aside>
  );
}

function EmptyState({ onAddClick }) {
  return (
    <div style={styles.emptyState}>
      <Trophy size={40} color="#C8102E" strokeWidth={1.5} />
      <div style={styles.emptyTitle}>ابدأ بإضافة لاعب</div>
      <button style={styles.emptyBtn} onClick={onAddClick}><Plus size={16} /> إضافة أول لاعب</button>
    </div>
  );
}

function AddPlayerModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("BJJ");
  const [belt, setBelt] = useState("WHITE");
  const [weight, setWeight] = useState("");
  const [dob, setDob] = useState("2000-01-01");
  const canSave = name.trim().length > 0 && weight;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>لاعب جديد</div>
          <button style={styles.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <label style={styles.label}>الاسم</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم اللاعب" />
        <label style={styles.label}>تاريخ الميلاد</label>
        <input style={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        <label style={styles.label}>الرياضة</label>
        <div style={styles.segmented}>
          {["BJJ", "MMA", "BOTH"].map((s) => (
            <button key={s} onClick={() => setSport(s)} style={{ ...styles.segBtn, ...(sport === s ? styles.segBtnActive : {}) }}>{s}</button>
          ))}
        </div>
        <label style={styles.label}>الحزام الحالي</label>
        <div style={styles.segmented}>
          {BELTS.map((b) => (
            <button key={b} onClick={() => setBelt(b)} style={{ ...styles.segBtn, ...(belt === b ? styles.segBtnActive : {}) }}>{BELT_LABELS[b]}</button>
          ))}
        </div>
        <label style={styles.label}>الوزن (كجم)</label>
        <input style={styles.input} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" />
        <button style={{ ...styles.primaryBtn, opacity: canSave ? 1 : 0.4, marginTop: 20 }} disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), dob, sport, currentBelt: belt, weightKg: Number(weight) })}>
          حفظ اللاعب
        </button>
      </div>
    </div>
  );
}

function PlayerProfile({ player, assessments, skillCategories, roadmap, tab, setTab, onAddAssessment }) {
  const relevantSkills = useMemo(
    () => skillCategories.filter((s) => s.sport === "BOTH" || s.sport === player.sport || player.sport === "BOTH"),
    [skillCategories, player.sport]
  );

  const latestScores = useMemo(() => {
    const map = {};
    [...assessments].sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((a) => { map[a.skill_category_id] = a.score; });
    return map;
  }, [assessments]);

  const domainAverages = useMemo(() => {
    return Object.keys(DOMAINS).map((domain) => {
      const ids = relevantSkills.filter((s) => s.domain === domain).map((s) => s.id);
      const scores = ids.map((id) => latestScores[id]).filter((v) => v !== undefined);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { domain, label: DOMAINS[domain].label, value: Math.round(avg * 10) / 10, fullMark: 10 };
    });
  }, [relevantSkills, latestScores]);

  const trendData = useMemo(() => {
    const buckets = {};
    assessments.forEach((a) => {
      const mk = monthKey(a.date);
      const domain = a.skill_categories?.domain;
      if (!domain) return;
      if (!buckets[mk]) buckets[mk] = {};
      if (!buckets[mk][domain]) buckets[mk][domain] = [];
      buckets[mk][domain].push(a.score);
    });
    return Object.entries(buckets).sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, domains]) => {
      const row = { month };
      Object.entries(domains).forEach(([domain, scores]) => {
        row[domain] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      });
      return row;
    });
  }, [assessments]);

  return (
    <div style={styles.profile}>
      <div style={styles.profileHeader}>
        <div style={{ ...styles.avatarBig, background: BELT_COLORS[player.current_belt] }}>
          <User size={26} color={player.current_belt === "WHITE" ? "#0B0B0D" : "#F5F5F0"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.profileName}>{player.name}</div>
          <div style={styles.profileMeta}>{player.sport} · حزام {BELT_LABELS[player.current_belt]} · {player.weight_kg} كجم</div>
        </div>
        {roadmap.length > 0 && <div style={styles.roadmapBadge}>{roadmap.length} نقطة تطوير مفتوحة</div>}
      </div>

      <div style={styles.tabs}>
        {[["overview", "نظرة عامة"], ["assess", "تسجيل تقييم"], ["roadmap", "خطة التطوير"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...styles.tabBtn, ...(tab === key ? styles.tabBtnActive : {}) }}>{label}</button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab domainAverages={domainAverages} trendData={trendData} assessmentCount={assessments.length} />}
      {tab === "assess" && (
        <AssessTab relevantSkills={relevantSkills} latestScores={latestScores}
          onAdd={(skillId, score, date) => onAddAssessment(skillId, score, date)} />
      )}
      {tab === "roadmap" && <RoadmapTab roadmap={roadmap} />}
    </div>
  );
}

function OverviewTab({ domainAverages, trendData, assessmentCount }) {
  const hasData = domainAverages.some((d) => d.value > 0);
  return (
    <div>
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>لقطة المستوى الحالي — حسب المحور</div>
        {!hasData ? <ChartEmpty text="سجّل تقييم واحد على الأقل عشان تظهر اللقطة" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={domainAverages}>
              <PolarGrid stroke="#2A2A2E" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "#B5B5B8", fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#5A5A5E", fontSize: 10 }} />
              <Radar dataKey="value" stroke="#C8102E" fill="#C8102E" fillOpacity={0.35} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>تطور المستوى عبر الوقت</div>
        {trendData.length < 2 ? <ChartEmpty text="سجّل تقييمات في أكتر من تاريخ عشان يظهر منحنى التطور" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="#1E1E21" />
              <XAxis dataKey="month" tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "#8B8B8F", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#17171A", border: "1px solid #2A2A2E", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => DOMAINS[v]?.label || v} />
              {Object.keys(DOMAINS).map((d) => (
                <Line key={d} type="monotone" dataKey={d} stroke={DOMAINS[d].color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={styles.statRow}>
        <div style={styles.statChip}>إجمالي التقييمات المسجّلة: <b>{assessmentCount}</b></div>
      </div>
    </div>
  );
}

function ChartEmpty({ text }) { return <div style={styles.chartEmpty}>{text}</div>; }

function AssessTab({ relevantSkills, latestScores, onAdd }) {
  const [skillId, setSkillId] = useState(relevantSkills[0]?.id || "");
  const [score, setScore] = useState(7);
  const [date, setDate] = useState(todayISO());

  useEffect(() => { if (!skillId && relevantSkills[0]) setSkillId(relevantSkills[0].id); }, [relevantSkills, skillId]);

  const grouped = useMemo(() => {
    const g = {};
    relevantSkills.forEach((s) => { if (!g[s.domain]) g[s.domain] = []; g[s.domain].push(s); });
    return g;
  }, [relevantSkills]);

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>تسجيل تقييم مهارة</div>
      <label style={styles.label}>المهارة</label>
      <select style={styles.input} value={skillId} onChange={(e) => setSkillId(e.target.value)}>
        {Object.entries(grouped).map(([domain, skills]) => (
          <optgroup key={domain} label={DOMAINS[domain]?.label || domain}>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name} {latestScores[s.id] !== undefined ? `(آخر درجة: ${latestScores[s.id]})` : ""}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <label style={styles.label}>الدرجة: {score} / 10</label>
      <input type="range" min={1} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))} style={styles.slider} />
      <label style={styles.label}>التاريخ</label>
      <input type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
      <button style={{ ...styles.primaryBtn, marginTop: 20 }} onClick={() => onAdd(skillId, score, date)}><Plus size={15} /> حفظ التقييم</button>
    </div>
  );
}

function RoadmapTab({ roadmap }) {
  if (roadmap.length === 0) {
    return <div style={styles.chartCard}><div style={styles.chartEmpty}>مفيش نقاط ضعف مسجّلة دلوقتي.</div></div>;
  }
  return (
    <div>
      {roadmap.map((item) => (
        <div key={item.id} style={styles.roadmapCard}>
          <div style={{ ...styles.priorityDot, background: item.priority === 1 ? "#C8102E" : "#D4A72C" }} />
          <div style={{ flex: 1 }}>
            <div style={styles.roadmapCardTitle}>{item.title}</div>
            <div style={styles.roadmapCardText}>{item.recommendation}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  app: { display: "flex", minHeight: "100vh", background: "#0B0B0D", fontFamily: "'Inter', sans-serif", color: "#F5F5F0" },
  sidebar: { width: 280, borderLeft: "1px solid #1E1E21", display: "flex", flexDirection: "column", padding: "20px 16px", flexShrink: 0 },
  brand: { display: "flex", gap: 12, alignItems: "center", marginBottom: 24, padding: "0 4px" },
  brandMark: { width: 42, height: 42, borderRadius: 8, background: "#C8102E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 15 },
  brandTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600 },
  brandSub: { fontSize: 11, color: "#6B6B6F", marginTop: 2 },
  addPlayerBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#17171A", border: "1px solid #2A2A2E", color: "#F5F5F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 16 },
  playerList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 },
  noPlayers: { color: "#5A5A5E", fontSize: 12.5, textAlign: "center", padding: "20px 8px", lineHeight: 1.6 },
  playerRow: { display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "1px solid transparent", borderRadius: 8, padding: "10px 10px", cursor: "pointer", textAlign: "right" },
  playerRowActive: { background: "#17171A", border: "1px solid #2A2A2E" },
  beltDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, border: "1px solid #3A3A3E" },
  playerName: { fontSize: 13.5, fontWeight: 500 },
  playerMeta: { fontSize: 11, color: "#6B6B6F", marginTop: 2 },
  main: { flex: 1, padding: "32px 40px", overflowY: "auto" },
  errorBanner: { background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.4)", color: "#E8536A", fontSize: 12.5, padding: "10px 14px", borderRadius: 8, marginBottom: 16 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 12, textAlign: "center" },
  emptyTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600 },
  emptyBtn: { display: "flex", alignItems: "center", gap: 8, background: "#C8102E", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  profile: { maxWidth: 760 },
  profileHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  avatarBig: { width: 56, height: 56, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 600 },
  profileMeta: { color: "#8B8B8F", fontSize: 13, marginTop: 4 },
  roadmapBadge: { background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.4)", color: "#E8536A", fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid #1E1E21", marginBottom: 24 },
  tabBtn: { background: "transparent", border: "none", color: "#6B6B6F", padding: "10px 4px", marginLeft: 24, fontSize: 13.5, fontWeight: 500, cursor: "pointer", borderBottom: "2px solid transparent" },
  tabBtnActive: { color: "#F5F5F0", borderBottom: "2px solid #C8102E" },
  chartCard: { background: "#111113", border: "1px solid #1E1E21", borderRadius: 12, padding: 20, marginBottom: 20 },
  chartTitle: { fontSize: 13.5, fontWeight: 600, color: "#D5D5D0", marginBottom: 12 },
  chartEmpty: { color: "#5A5A5E", fontSize: 12.5, textAlign: "center", padding: "40px 20px", lineHeight: 1.7 },
  statRow: { display: "flex", gap: 10 },
  statChip: { background: "#111113", border: "1px solid #1E1E21", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#8B8B8F" },
  label: { display: "block", fontSize: 12, color: "#8B8B8F", marginTop: 14, marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", background: "#0B0B0D", border: "1px solid #2A2A2E", borderRadius: 8, padding: "10px 12px", color: "#F5F5F0", fontSize: 13.5, fontFamily: "'Inter', sans-serif" },
  slider: { width: "100%", accentColor: "#C8102E" },
  segmented: { display: "flex", gap: 6, flexWrap: "wrap" },
  segBtn: { background: "#0B0B0D", border: "1px solid #2A2A2E", color: "#8B8B8F", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer" },
  segBtnActive: { background: "#C8102E", borderColor: "#C8102E", color: "#fff" },
  primaryBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#C8102E", color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", width: "100%" },
  roadmapCard: { display: "flex", gap: 12, background: "#111113", border: "1px solid #1E1E21", borderRadius: 10, padding: 16, marginBottom: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  roadmapCardTitle: { fontSize: 13.5, fontWeight: 600, marginBottom: 6 },
  roadmapCardText: { fontSize: 12.5, color: "#9B9B9F", lineHeight: 1.6 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { background: "#111113", border: "1px solid #2A2A2E", borderRadius: 14, padding: 24, width: 360, maxHeight: "85vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 600 },
  iconBtn: { background: "transparent", border: "none", color: "#8B8B8F", cursor: "pointer", padding: 4 },
};
