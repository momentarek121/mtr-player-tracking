-- AI-generated player plans remain drafts until a coach reviews them.

alter table public.player_exercises add column if not exists source text not null default 'COACH';
alter table public.player_exercises add column if not exists review_status text not null default 'APPROVED';
alter table public.player_exercises add column if not exists review_note text;
alter table public.player_exercises add column if not exists reviewed_at timestamptz;
alter table public.player_exercises add column if not exists reviewed_by uuid;
alter table public.player_exercises add column if not exists fight_camp_id uuid;

alter table public.player_meals add column if not exists source text not null default 'COACH';
alter table public.player_meals add column if not exists review_status text not null default 'APPROVED';
alter table public.player_meals add column if not exists review_note text;
alter table public.player_meals add column if not exists reviewed_at timestamptz;
alter table public.player_meals add column if not exists reviewed_by uuid;
alter table public.player_meals add column if not exists fight_camp_id uuid;

alter table public.player_goals add column if not exists review_status text not null default 'APPROVED';
alter table public.player_goals add column if not exists review_note text;
alter table public.player_goals add column if not exists reviewed_at timestamptz;
alter table public.player_goals add column if not exists reviewed_by uuid;
alter table public.player_goals add column if not exists fight_camp_id uuid;

create index if not exists idx_player_exercises_review_status on public.player_exercises(player_id, review_status);
create index if not exists idx_player_meals_review_status on public.player_meals(player_id, review_status);
create index if not exists idx_player_goals_review_status on public.player_goals(player_id, review_status);
