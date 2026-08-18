create table if not exists public.performance_item_media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.performance_program_items(id) on delete cascade,
  attachment_id uuid not null references public.player_attachments(id) on delete cascade,
  timestamp_sec numeric,
  note text,
  created_by uuid references public.coaches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (item_id, attachment_id, timestamp_sec)
);
create index if not exists idx_performance_item_media_item on public.performance_item_media(item_id, created_at desc);
alter table public.performance_item_media enable row level security;
create policy "allow all - performance item media" on public.performance_item_media for all using (true) with check (true);
