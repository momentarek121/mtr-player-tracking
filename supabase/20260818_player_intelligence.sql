-- Player intelligence layer: every player-chat message can create an insight,
-- a coach notification, and a continuously updated development report.

alter table public.player_goals add column if not exists created_from_chat_id uuid;
alter table public.player_exercises add column if not exists created_from_chat_id uuid;
alter table public.player_meals add column if not exists created_from_chat_id uuid;

create table if not exists public.player_chat_insights (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  source_log_id uuid references public.player_chat_logs(id) on delete set null,
  category text not null default 'OTHER',
  urgency text not null default 'NORMAL',
  summary text not null,
  mindset_signal text,
  recommended_action text,
  message_excerpt text,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

create table if not exists public.coach_notifications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  insight_id uuid references public.player_chat_insights(id) on delete cascade,
  notification_type text not null default 'CHAT_INSIGHT',
  title text not null,
  body text not null,
  severity text not null default 'NORMAL',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  read_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.player_development_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  report_type text not null default 'LIVE_DEVELOPMENT',
  title text not null default 'تقرير التطوير الشامل',
  summary text not null default '',
  report_json jsonb not null default '{}'::jsonb,
  source_event_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(player_id, report_type)
);

create index if not exists idx_player_chat_insights_player_created on public.player_chat_insights(player_id, created_at desc);
create index if not exists idx_coach_notifications_unread on public.coach_notifications(read_at, created_at desc);
create index if not exists idx_player_development_reports_player on public.player_development_reports(player_id, report_type);
