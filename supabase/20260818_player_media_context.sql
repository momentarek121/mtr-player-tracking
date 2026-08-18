alter table public.player_attachments
  add column if not exists skill_category_id uuid references public.skill_categories(id) on delete set null,
  add column if not exists roadmap_item_id uuid references public.player_roadmap_items(id) on delete set null,
  add column if not exists caption text,
  add column if not exists stage text,
  add column if not exists captured_at date,
  add column if not exists visibility text not null default 'COACH_AND_PLAYER';

create index if not exists idx_player_attachments_skill
  on public.player_attachments(player_id, skill_category_id, uploaded_at desc);

create index if not exists idx_player_attachments_roadmap
  on public.player_attachments(roadmap_item_id, uploaded_at desc);

alter table public.player_attachments
  drop constraint if exists player_attachments_visibility_check;

alter table public.player_attachments
  add constraint player_attachments_visibility_check
  check (visibility in ('COACH_ONLY', 'COACH_AND_PLAYER', 'COACH_PLAYER_GUARDIAN'));
