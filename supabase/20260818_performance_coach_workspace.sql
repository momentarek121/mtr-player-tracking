create table if not exists public.performance_coach_players (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  assigned_by uuid references public.coaches(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (coach_id, player_id)
);

create table if not exists public.performance_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  title text not null,
  goal text,
  start_date date,
  end_date date,
  status text not null default 'ACTIVE',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performance_programs_status_check check (status in ('DRAFT','ACTIVE','COMPLETED','PAUSED'))
);

create table if not exists public.performance_program_items (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.performance_programs(id) on delete cascade,
  day_label text,
  exercise_name text not null,
  category text not null default 'STRENGTH',
  sets text,
  reps text,
  load text,
  rest text,
  instructions text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint performance_program_items_category_check check (category in ('STRENGTH','CONDITIONING','MOBILITY','RECOVERY','TEST'))
);

create index if not exists idx_performance_assignments_coach on public.performance_coach_players(coach_id, active, player_id);
create index if not exists idx_performance_assignments_player on public.performance_coach_players(player_id, active);
create index if not exists idx_performance_programs_player on public.performance_programs(player_id, status, start_date);
create index if not exists idx_performance_program_items_program on public.performance_program_items(program_id, day_label, completed);

alter table public.performance_coach_players enable row level security;
alter table public.performance_programs enable row level security;
alter table public.performance_program_items enable row level security;
create policy "allow all - performance assignments" on public.performance_coach_players for all using (true) with check (true);
create policy "allow all - performance programs" on public.performance_programs for all using (true) with check (true);
create policy "allow all - performance program items" on public.performance_program_items for all using (true) with check (true);
