-- Alpacapardy live multiplayer schema.
-- Safe to review and run in the Supabase SQL Editor after alpaccounts.sql.
-- This prepares the shared live-session tables for Alpacapardy, Alpaca Run, Quiz, Survivalpaca, and Alpaquiz.

create extension if not exists pgcrypto;

create table if not exists public.alpacapardy_live_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  game_type text not null default 'alpacapardy',
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby',
  visibility text not null default 'public',
  max_players integer not null default 2,
  is_open boolean not null default true,
  theme_year integer not null default 2026,
  settings jsonb not null default '{}'::jsonb,
  board_state jsonb not null default '{}'::jsonb,
  current_state jsonb not null default '{}'::jsonb,
  host_last_seen_at timestamptz not null default now(),
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alpacapardy_live_sessions_room_code_format check (room_code ~ '^[A-Z0-9]{4,12}$'),
  constraint alpacapardy_live_sessions_game_type_check check (game_type in ('alpacapardy', 'run', 'quiz', 'race', 'alpaquiz')),
  constraint alpacapardy_live_sessions_status_check check (status in ('lobby', 'playing', 'finished', 'abandoned', 'archived')),
  constraint alpacapardy_live_sessions_visibility_check check (visibility in ('public', 'private')),
  constraint alpacapardy_live_sessions_max_players_check check (max_players between 2 and 4)
);

create table if not exists public.alpacapardy_live_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.alpacapardy_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'player',
  team_index integer,
  is_guest boolean not null default false,
  connection_status text not null default 'online',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint alpacapardy_live_players_role_check check (role in ('host', 'player', 'spectator')),
  constraint alpacapardy_live_players_team_index_check check (team_index is null or team_index between 0 and 3),
  constraint alpacapardy_live_players_connection_check check (connection_status in ('online', 'offline')),
  constraint alpacapardy_live_players_display_name_check check (char_length(trim(display_name)) between 2 and 64)
);

alter table public.alpacapardy_live_sessions
  add column if not exists game_type text not null default 'alpacapardy',
  add column if not exists visibility text not null default 'public',
  add column if not exists max_players integer not null default 2,
  add column if not exists is_open boolean not null default true,
  add column if not exists host_last_seen_at timestamptz not null default now(),
  add column if not exists closed_reason text;

alter table public.alpacapardy_live_players
  add column if not exists team_index integer,
  add column if not exists is_guest boolean not null default false;

alter table public.alpacapardy_live_sessions
  drop constraint if exists alpacapardy_live_sessions_status_check,
  drop constraint if exists alpacapardy_live_sessions_game_type_check,
  drop constraint if exists alpacapardy_live_sessions_visibility_check,
  drop constraint if exists alpacapardy_live_sessions_max_players_check,
  add constraint alpacapardy_live_sessions_status_check check (status in ('lobby', 'playing', 'finished', 'abandoned', 'archived')),
  add constraint alpacapardy_live_sessions_game_type_check check (game_type in ('alpacapardy', 'run', 'quiz', 'race', 'alpaquiz')),
  add constraint alpacapardy_live_sessions_visibility_check check (visibility in ('public', 'private')),
  add constraint alpacapardy_live_sessions_max_players_check check (max_players between 2 and 4);

alter table public.alpacapardy_live_players
  drop constraint if exists alpacapardy_live_players_team_index_check,
  add constraint alpacapardy_live_players_team_index_check check (team_index is null or team_index between 0 and 3);

create unique index if not exists alpacapardy_live_players_session_user_key
  on public.alpacapardy_live_players(session_id, user_id);

create unique index if not exists alpacapardy_live_players_session_team_key
  on public.alpacapardy_live_players(session_id, team_index)
  where team_index is not null and role in ('host', 'player');

create index if not exists alpacapardy_live_sessions_open_lobby_idx
  on public.alpacapardy_live_sessions(game_type, status, is_open, visibility, host_last_seen_at desc);

create index if not exists alpacapardy_live_players_session_role_idx
  on public.alpacapardy_live_players(session_id, role, connection_status);

create table if not exists public.alpacapardy_live_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.alpacapardy_live_sessions(id) on delete cascade,
  player_id uuid references public.alpacapardy_live_players(id) on delete set null,
  revision bigint not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint alpacapardy_live_events_revision_check check (revision > 0),
  constraint alpacapardy_live_events_type_check check (event_type ~ '^(alpacapardy|run|quiz|race|alpaquiz)\.[a-z_]+$')
);

alter table public.alpacapardy_live_events
  drop constraint if exists alpacapardy_live_events_type_check,
  add constraint alpacapardy_live_events_type_check check (event_type ~ '^(alpacapardy|run|quiz|race|alpaquiz)\.[a-z_]+$');

create unique index if not exists alpacapardy_live_events_session_revision_key
  on public.alpacapardy_live_events(session_id, revision);

create index if not exists alpacapardy_live_events_session_created_idx
  on public.alpacapardy_live_events(session_id, created_at);

create table if not exists public.alpacapardy_live_snapshots (
  session_id uuid primary key references public.alpacapardy_live_sessions(id) on delete cascade,
  revision bigint not null default 0,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint alpacapardy_live_snapshots_revision_check check (revision >= 0)
);

create or replace function public.touch_alpacapardy_live_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_alpacapardy_live_sessions_updated_at on public.alpacapardy_live_sessions;
create trigger touch_alpacapardy_live_sessions_updated_at
  before update on public.alpacapardy_live_sessions
  for each row
  execute function public.touch_alpacapardy_live_updated_at();

drop trigger if exists touch_alpacapardy_live_snapshots_updated_at on public.alpacapardy_live_snapshots;
create trigger touch_alpacapardy_live_snapshots_updated_at
  before update on public.alpacapardy_live_snapshots
  for each row
  execute function public.touch_alpacapardy_live_updated_at();

create schema if not exists private;

create or replace function private.is_alpacapardy_live_public_lobby(p_session_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.alpacapardy_live_sessions session
    where session.id = p_session_id
      and session.game_type in ('alpacapardy', 'run', 'quiz', 'race', 'alpaquiz')
      and session.visibility = 'public'
      and session.status = 'lobby'
      and session.is_open = true
      and session.host_last_seen_at > now() - interval '90 seconds'
  );
$$;

create or replace function private.is_alpacapardy_live_participant(p_session_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.alpacapardy_live_players player
    where player.session_id = p_session_id
      and player.user_id = (select auth.uid())
  );
$$;

create or replace function private.alpacapardy_live_player_count(p_session_id uuid)
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.alpacapardy_live_players player
  where player.session_id = p_session_id
    and player.role in ('host', 'player');
$$;

revoke all on function private.is_alpacapardy_live_public_lobby(uuid) from public;
revoke all on function private.is_alpacapardy_live_participant(uuid) from public;
revoke all on function private.alpacapardy_live_player_count(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_alpacapardy_live_public_lobby(uuid) to authenticated;
grant execute on function private.is_alpacapardy_live_participant(uuid) to authenticated;
grant execute on function private.alpacapardy_live_player_count(uuid) to authenticated;

create or replace function private.is_alpacapardy_live_admin_tester()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  with current_email as (
    select lower(coalesce(auth.jwt() ->> 'email', '')) as email
  )
  select
    email in (
      'moretfrancoisea@gmail.com',
      'francois.moret@ilg-ks.org',
      'frenchease.admin@gmail.com',
      'ballingballer6969@gmail.com'
    )
    or email like '%@ilg-ks.org'
    or email like '%@hcas.com.tw'
    or email like '%@ykc.edu.mk'
  from current_email;
$$;

revoke all on function private.is_alpacapardy_live_admin_tester() from public;
grant execute on function private.is_alpacapardy_live_admin_tester() to authenticated;

alter table public.alpacapardy_live_sessions enable row level security;
alter table public.alpacapardy_live_players enable row level security;
alter table public.alpacapardy_live_events enable row level security;
alter table public.alpacapardy_live_snapshots enable row level security;

grant select, insert, update on public.alpacapardy_live_sessions to authenticated;
grant select, insert, update on public.alpacapardy_live_players to authenticated;
grant select, insert on public.alpacapardy_live_events to authenticated;
grant select, insert, update on public.alpacapardy_live_snapshots to authenticated;

drop policy if exists "Authenticated users can find live Alpacapardy sessions" on public.alpacapardy_live_sessions;
drop policy if exists "Users can view public lobby or their Alpacapardy session" on public.alpacapardy_live_sessions;
create policy "Users can view public lobby or their Alpacapardy session"
  on public.alpacapardy_live_sessions
  for select
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (
      private.is_alpacapardy_live_public_lobby(id)
      or host_user_id = (select auth.uid())
      or private.is_alpacapardy_live_participant(id)
    )
  );

drop policy if exists "Hosts can create Alpacapardy sessions" on public.alpacapardy_live_sessions;
create policy "Hosts can create Alpacapardy sessions"
  on public.alpacapardy_live_sessions
  for insert
  to authenticated
  with check (
    private.is_alpacapardy_live_admin_tester()
    and (select auth.uid()) = host_user_id
  );

drop policy if exists "Hosts can update their Alpacapardy sessions" on public.alpacapardy_live_sessions;
create policy "Hosts can update their Alpacapardy sessions"
  on public.alpacapardy_live_sessions
  for update
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (select auth.uid()) = host_user_id
  )
  with check (
    private.is_alpacapardy_live_admin_tester()
    and (select auth.uid()) = host_user_id
  );

drop policy if exists "Authenticated users can view Alpacapardy players" on public.alpacapardy_live_players;
drop policy if exists "Users can view public lobby players or their room players" on public.alpacapardy_live_players;
create policy "Users can view public lobby players or their room players"
  on public.alpacapardy_live_players
  for select
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (
      private.is_alpacapardy_live_public_lobby(session_id)
      or private.is_alpacapardy_live_participant(session_id)
      or exists (
        select 1
        from public.alpacapardy_live_sessions session
        where session.id = alpacapardy_live_players.session_id
          and session.host_user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can join as their own Alpacapardy player" on public.alpacapardy_live_players;
create policy "Users can join as their own Alpacapardy player"
  on public.alpacapardy_live_players
  for insert
  to authenticated
  with check (
    private.is_alpacapardy_live_admin_tester()
    and
    (select auth.uid()) = user_id
    and role in ('host', 'player')
    and team_index is not null
    and exists (
      select 1
      from public.alpacapardy_live_sessions session
      where session.id = alpacapardy_live_players.session_id
        and session.status = 'lobby'
        and session.is_open = true
    )
    and (
      (
        role = 'host'
        and exists (
          select 1
          from public.alpacapardy_live_sessions session
          where session.id = alpacapardy_live_players.session_id
            and session.host_user_id = (select auth.uid())
        )
      )
      or (
        role = 'player'
        and private.alpacapardy_live_player_count(session_id) < (
          select session.max_players
          from public.alpacapardy_live_sessions session
          where session.id = alpacapardy_live_players.session_id
        )
      )
    )
  );

drop policy if exists "Users can update their own Alpacapardy player" on public.alpacapardy_live_players;
create policy "Users can update their own Alpacapardy player"
  on public.alpacapardy_live_players
  for update
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (select auth.uid()) = user_id
  )
  with check (
    private.is_alpacapardy_live_admin_tester()
    and (select auth.uid()) = user_id
  );

drop policy if exists "Participants can view Alpacapardy events" on public.alpacapardy_live_events;
create policy "Participants can view Alpacapardy events"
  on public.alpacapardy_live_events
  for select
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (
      private.is_alpacapardy_live_participant(session_id)
      or exists (
        select 1
        from public.alpacapardy_live_sessions session
        where session.id = alpacapardy_live_events.session_id
          and session.host_user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Participants can create Alpacapardy events" on public.alpacapardy_live_events;
create policy "Participants can create Alpacapardy events"
  on public.alpacapardy_live_events
  for insert
  to authenticated
  with check (
    private.is_alpacapardy_live_admin_tester()
    and
    exists (
      select 1
      from public.alpacapardy_live_players player
      where player.id = alpacapardy_live_events.player_id
        and player.session_id = alpacapardy_live_events.session_id
        and player.user_id = (select auth.uid())
    )
  );

drop policy if exists "Participants can view Alpacapardy snapshots" on public.alpacapardy_live_snapshots;
create policy "Participants can view Alpacapardy snapshots"
  on public.alpacapardy_live_snapshots
  for select
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and (
      private.is_alpacapardy_live_participant(session_id)
      or exists (
        select 1
        from public.alpacapardy_live_sessions session
        where session.id = alpacapardy_live_snapshots.session_id
          and session.host_user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Hosts can create Alpacapardy snapshots" on public.alpacapardy_live_snapshots;
create policy "Hosts can create Alpacapardy snapshots"
  on public.alpacapardy_live_snapshots
  for insert
  to authenticated
  with check (
    private.is_alpacapardy_live_admin_tester()
    and
    exists (
      select 1
      from public.alpacapardy_live_sessions session
      where session.id = alpacapardy_live_snapshots.session_id
        and session.host_user_id = (select auth.uid())
    )
  );

drop policy if exists "Hosts can update Alpacapardy snapshots" on public.alpacapardy_live_snapshots;
create policy "Hosts can update Alpacapardy snapshots"
  on public.alpacapardy_live_snapshots
  for update
  to authenticated
  using (
    private.is_alpacapardy_live_admin_tester()
    and
    exists (
      select 1
      from public.alpacapardy_live_sessions session
      where session.id = alpacapardy_live_snapshots.session_id
        and session.host_user_id = (select auth.uid())
    )
  )
  with check (
    private.is_alpacapardy_live_admin_tester()
    and
    exists (
      select 1
      from public.alpacapardy_live_sessions session
      where session.id = alpacapardy_live_snapshots.session_id
        and session.host_user_id = (select auth.uid())
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alpacapardy_live_sessions'
  ) then
    alter publication supabase_realtime add table public.alpacapardy_live_sessions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alpacapardy_live_players'
  ) then
    alter publication supabase_realtime add table public.alpacapardy_live_players;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alpacapardy_live_events'
  ) then
    alter publication supabase_realtime add table public.alpacapardy_live_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alpacapardy_live_snapshots'
  ) then
    alter publication supabase_realtime add table public.alpacapardy_live_snapshots;
  end if;
end;
$$;
