-- Stable identity links for coach and player sessions.
-- Safe to apply on databases where the columns already exist.

alter table public.coaches
  add column if not exists auth_user_id uuid;

alter table public.players
  add column if not exists auth_user_id uuid;

create index if not exists idx_coaches_auth_user_id
  on public.coaches(auth_user_id);

create index if not exists idx_players_auth_user_id
  on public.players(auth_user_id);

comment on column public.coaches.auth_user_id is 'Supabase Auth user UUID linked to this coach account';
comment on column public.players.auth_user_id is 'Supabase Auth user UUID linked to this player account';
