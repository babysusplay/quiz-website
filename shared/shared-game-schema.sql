-- Shared game data foundation for Quiz, Drawzy and Puzzle.
-- Review and run this in the Supabase SQL Editor.
-- Existing quiz tables are intentionally left unchanged.

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_type text not null check (game_type in ('quiz', 'drawzy', 'puzzle')),
  score bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_scores_game_type_score_idx
  on public.game_scores (game_type, score desc);

create index if not exists game_scores_user_game_idx
  on public.game_scores (user_id, game_type, created_at desc);

-- Browser clients must not be able to read or modify another player's score rows.
-- The Main Hub will use the controlled leaderboard function below instead.
alter table public.game_scores enable row level security;

drop policy if exists "game scores: owner insert" on public.game_scores;
drop policy if exists "game scores: owner read" on public.game_scores;
drop policy if exists "game scores: owner update" on public.game_scores;
drop policy if exists "game scores: owner delete" on public.game_scores;

create policy "game scores: owner insert"
  on public.game_scores
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "game scores: owner read"
  on public.game_scores
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "game scores: owner update"
  on public.game_scores
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "game scores: owner delete"
  on public.game_scores
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- One common leaderboard endpoint for the future Main Hub.
-- SECURITY DEFINER is used so the function can aggregate protected score rows.
-- search_path is pinned and every object is schema-qualified.
create or replace function public.get_game_leaderboard(
  requested_game text,
  result_limit integer default 100
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_score bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id as user_id,
    coalesce(p.display_name, 'Player') as display_name,
    p.avatar_url,
    coalesce(sum(gs.score), 0)::bigint as total_score
  from public.game_scores as gs
  join public.profiles as p on p.id = gs.user_id
  where gs.game_type = requested_game
  group by p.id, p.display_name, p.avatar_url
  order by total_score desc, p.display_name asc
  limit greatest(1, least(coalesce(result_limit, 100), 100));
$$;

-- The leaderboard is intentionally callable only by signed-in users.
revoke execute on function public.get_game_leaderboard(text, integer) from public;
revoke execute on function public.get_game_leaderboard(text, integer) from anon;
grant execute on function public.get_game_leaderboard(text, integer) to authenticated;

-- Keep the score table reachable only through the intended authenticated paths.
grant insert, select, update, delete on public.game_scores to authenticated;
revoke all on public.game_scores from anon;
