-- ============================================================
-- MTR Team — Player Tracking & Performance Analytics Schema
-- This is the EXACT migration already applied to the live
-- Supabase project (mtr-player-tracking / bvoopymudmupahkovidd).
-- Kept here for version control / to recreate on a new project.
-- ============================================================

create extension if not exists "pgcrypto";

create type sport as enum ('BJJ', 'MMA', 'BOTH');
create type belt_rank as enum ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK');
create type user_role as enum ('ADMIN', 'HEAD_COACH', 'COACH', 'PLAYER');
create type session_type as enum ('TECHNICAL', 'PHYSICAL', 'SPARRING', 'TACTICAL', 'COMPETITION_PREP');
create type skill_domain as enum ('TECHNICAL', 'TACTICAL', 'PHYSICAL', 'MENTAL');
create type physical_test_type as enum (
  'BEEP_TEST','MAX_PUSHUPS','MAX_PULLUPS','PLANK_SECONDS','GRIP_STRENGTH_KG',
  'SIT_AND_REACH_CM','SPRINT_20M_SEC','VERTICAL_JUMP_CM','BODY_FAT_PERCENT',
  'BENCH_PRESS_1RM_KG','SQUAT_1RM_KG'
);
create type competition_result_type as enum (
  'WIN_SUBMISSION','WIN_POINTS','WIN_DECISION','WIN_KO_TKO',
  'LOSS_SUBMISSION','LOSS_POINTS','LOSS_DECISION','LOSS_KO_TKO','DRAW','DQ'
);

create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role user_role not null default 'COACH',
  email text unique not null,
  phone text,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dob date not null,
  weight_kg numeric not null,
  height_cm numeric,
  sport sport not null default 'BJJ',
  current_belt belt_rank not null default 'WHITE',
  stripes int not null default 0,
  join_date date not null default current_date,
  active boolean not null default true,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table belt_promotions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  belt belt_rank not null,
  stripes int not null default 0,
  date date not null default current_date,
  awarded_by text,
  notes text
);

create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  type session_type not null,
  sport sport not null default 'BJJ',
  duration_min int not null,
  coach_id uuid references coaches(id),
  topic text,
  notes text,
  created_at timestamptz not null default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  session_id uuid not null references training_sessions(id) on delete cascade,
  present boolean not null default true,
  notes text,
  unique (player_id, session_id)
);

create table skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain skill_domain not null,
  sport sport not null default 'BOTH',
  description text
);

create table skill_assessments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  skill_category_id uuid not null references skill_categories(id),
  score int not null check (score between 1 and 10),
  assessed_by_id uuid references coaches(id),
  date timestamptz not null default now(),
  notes text
);
create index idx_skill_assessments_player_date on skill_assessments(player_id, date);

create table physical_tests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  test_type physical_test_type not null,
  value numeric not null,
  unit text not null,
  date timestamptz not null default now(),
  recorded_by_id uuid references coaches(id)
);
create index idx_physical_tests_player_type_date on physical_tests(player_id, test_type, date);

create table competition_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  competition_name text not null,
  date timestamptz not null,
  sport sport not null,
  weight_class text,
  opponent_name text,
  result competition_result_type not null,
  notes text
);

create table roadmap_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skill_category_id uuid not null references skill_categories(id),
  score_below int not null,
  recommendation text not null,
  priority int not null default 1,
  active boolean not null default true
);

create table player_roadmap_items (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  rule_id uuid references roadmap_rules(id),
  title text not null,
  recommendation text not null,
  priority int not null default 1,
  status text not null default 'OPEN',
  generated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table coaches enable row level security;
alter table players enable row level security;
alter table belt_promotions enable row level security;
alter table training_sessions enable row level security;
alter table attendance enable row level security;
alter table skill_categories enable row level security;
alter table skill_assessments enable row level security;
alter table physical_tests enable row level security;
alter table competition_results enable row level security;
alter table roadmap_rules enable row level security;
alter table player_roadmap_items enable row level security;

-- NOTE: "allow all" policies below are open for MVP testing.
-- Tighten these (e.g. scope to authenticated coach role) before real use.
create policy "allow all - coaches" on coaches for all using (true) with check (true);
create policy "allow all - players" on players for all using (true) with check (true);
create policy "allow all - belt_promotions" on belt_promotions for all using (true) with check (true);
create policy "allow all - training_sessions" on training_sessions for all using (true) with check (true);
create policy "allow all - attendance" on attendance for all using (true) with check (true);
create policy "allow all - skill_categories" on skill_categories for all using (true) with check (true);
create policy "allow all - skill_assessments" on skill_assessments for all using (true) with check (true);
create policy "allow all - physical_tests" on physical_tests for all using (true) with check (true);
create policy "allow all - competition_results" on competition_results for all using (true) with check (true);
create policy "allow all - roadmap_rules" on roadmap_rules for all using (true) with check (true);
create policy "allow all - player_roadmap_items" on player_roadmap_items for all using (true) with check (true);
