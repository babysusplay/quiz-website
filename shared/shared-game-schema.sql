-- Shared game data foundation for Quiz, Drawzy and Puzzle.
-- Run this in the Supabase SQL editor after reviewing RLS for your project.
-- Existing quiz tables remain unchanged.

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

-- One common leaderboard endpoint for the future Main Hub.
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
set search_path = public
as $$
  select
    p.id as user_id,
    coalesce(p.display_name, 'Player') as display_name,
    p.avatar_url,
    coalesce(sum(gs.score), 0)::bigint as total_score
  from public.game_scores gs
  join public.profiles p on p.id = gs.user_id
  where gs.game_type = requested_game
  group by p.id, p.display_name, p.avatar_url
  order by total_score desc, p.display_name asc
  limit greatest(1, least(result_limit, 100));
$$;
