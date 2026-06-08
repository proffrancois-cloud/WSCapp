-- Alpaccount database setup / repair script.
-- Safe to re-run in the Supabase SQL Editor when the signup form changes.

create table if not exists public.alpaca_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alpaca_name text,
  email text,
  country text,
  school_name text,
  wsc_event_count integer default 0,
  highest_wsc_round text default 'none_yet',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.alpaca_profiles
  add column if not exists alpaca_name text,
  add column if not exists email text,
  add column if not exists country text,
  add column if not exists school_name text,
  add column if not exists wsc_event_count integer default 0,
  add column if not exists highest_wsc_round text default 'none_yet',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.alpaca_profiles as profile
set email = lower(trim(auth_user.email))
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email is not null
  and (profile.email is null or trim(profile.email) = '');

update public.alpaca_profiles
set
  alpaca_name = case
    when lower(trim(coalesce(alpaca_name, ''))) ~ '^[a-z0-9][a-z0-9_-]{2,31}$'
      then lower(trim(alpaca_name))
    else 'alpaca_' || left(replace(id::text, '-', ''), 24)
  end,
  email = case
    when trim(coalesce(email, '')) <> ''
      then lower(trim(email))
    else lower(replace(id::text, '-', '') || '@alpaccount.local')
  end,
  country = coalesce(nullif(trim(country), ''), 'Unknown'),
  school_name = coalesce(nullif(trim(school_name), ''), 'Unknown school'),
  wsc_event_count = least(greatest(coalesce(wsc_event_count, 0), 0), 99),
  highest_wsc_round = case
    when lower(trim(coalesce(highest_wsc_round, ''))) in ('none_yet', 'regional_round', 'global_round', 'tournament_of_champions')
      then lower(trim(highest_wsc_round))
    else 'none_yet'
  end,
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.alpaca_profiles
  alter column alpaca_name set not null,
  alter column email set not null,
  alter column country set not null,
  alter column school_name set not null,
  alter column wsc_event_count set not null,
  alter column highest_wsc_round set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_alpaca_name_key'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_alpaca_name_key unique (alpaca_name);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_email_key'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_email_key unique (email);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_wsc_event_count_check'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_wsc_event_count_check check (wsc_event_count >= 0 and wsc_event_count <= 99);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_highest_wsc_round_check'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_highest_wsc_round_check check (
        highest_wsc_round in ('none_yet', 'regional_round', 'global_round', 'tournament_of_champions')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_alpaca_name_format'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_alpaca_name_format check (
        alpaca_name ~ '^[a-z0-9][a-z0-9_-]{2,31}$'
      );
  end if;
end;
$$;

alter table public.alpaca_profiles enable row level security;

grant select, update on public.alpaca_profiles to authenticated;

drop policy if exists "Users can view their own alpaca profile" on public.alpaca_profiles;
create policy "Users can view their own alpaca profile"
  on public.alpaca_profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "Users can update their own alpaca profile" on public.alpaca_profiles;
create policy "Users can update their own alpaca profile"
  on public.alpaca_profiles
  for update
  to authenticated
  using (
    auth.uid() = id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  )
  with check (
    auth.uid() = id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

create or replace function public.touch_alpaca_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_alpaca_profile_updated_at on public.alpaca_profiles;
create trigger touch_alpaca_profile_updated_at
  before update on public.alpaca_profiles
  for each row
  execute function public.touch_alpaca_profile_updated_at();

create or replace function public.create_alpaca_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_alpaca_name text := lower(trim(coalesce(new.raw_user_meta_data ->> 'alpaca_name', '')));
  clean_email text := lower(trim(coalesce(new.email, '')));
  clean_country text := trim(coalesce(new.raw_user_meta_data ->> 'country', ''));
  clean_school_name text := trim(coalesce(new.raw_user_meta_data ->> 'school_name', ''));
  clean_wsc_event_count integer := 0;
  clean_highest_wsc_round text := lower(trim(coalesce(new.raw_user_meta_data ->> 'highest_wsc_round', '')));
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  begin
    clean_wsc_event_count := coalesce(nullif(new.raw_user_meta_data ->> 'wsc_event_count', '')::integer, 0);
  exception
    when invalid_text_representation then
      clean_wsc_event_count := 0;
  end;

  if clean_alpaca_name !~ '^[a-z0-9][a-z0-9_-]{2,31}$' then
    clean_alpaca_name := 'alpaca_' || left(replace(new.id::text, '-', ''), 24);
  end if;

  if clean_email = '' then
    clean_email := lower(replace(new.id::text, '-', '') || '@alpaccount.local');
  end if;

  if clean_country = '' then
    clean_country := 'Unknown';
  end if;

  if clean_school_name = '' then
    clean_school_name := 'Unknown school';
  end if;

  clean_wsc_event_count := least(greatest(clean_wsc_event_count, 0), 99);

  if clean_highest_wsc_round not in ('none_yet', 'regional_round', 'global_round', 'tournament_of_champions') then
    clean_highest_wsc_round := 'none_yet';
  end if;

  insert into public.alpaca_profiles (
    id,
    alpaca_name,
    email,
    country,
    school_name,
    wsc_event_count,
    highest_wsc_round
  )
  values (
    new.id,
    clean_alpaca_name,
    clean_email,
    clean_country,
    clean_school_name,
    clean_wsc_event_count,
    clean_highest_wsc_round
  )
  on conflict (id) do update
    set
      alpaca_name = excluded.alpaca_name,
      email = excluded.email,
      country = excluded.country,
      school_name = excluded.school_name,
      wsc_event_count = excluded.wsc_event_count,
      highest_wsc_round = excluded.highest_wsc_round,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists create_alpaca_profile_for_new_user on auth.users;
create trigger create_alpaca_profile_for_new_user
  after insert on auth.users
  for each row
  execute function public.create_alpaca_profile_for_new_user();

revoke all on function public.create_alpaca_profile_for_new_user() from public;

create or replace function public.resolve_alpaca_login(p_alpaca_name text)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select email
  from public.alpaca_profiles
  where alpaca_name = lower(trim(p_alpaca_name))
  limit 1;
$$;

revoke all on function public.resolve_alpaca_login(text) from public;
grant execute on function public.resolve_alpaca_login(text) to anon, authenticated;

create or replace function public.is_alpaca_name_available(p_alpaca_name text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select not exists (
    select 1
    from public.alpaca_profiles
    where alpaca_name = lower(trim(p_alpaca_name))
  );
$$;

revoke all on function public.is_alpaca_name_available(text) from public;
grant execute on function public.is_alpaca_name_available(text) to anon, authenticated;

create table if not exists public.alpaca_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_stats jsonb not null default '{}'::jsonb,
  raw_mastered_entries jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alpaca_progress enable row level security;

grant select, insert, update on public.alpaca_progress to authenticated;

drop policy if exists "Users can view their own alpaca progress" on public.alpaca_progress;
create policy "Users can view their own alpaca progress"
  on public.alpaca_progress
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "Users can insert their own alpaca progress" on public.alpaca_progress;
create policy "Users can insert their own alpaca progress"
  on public.alpaca_progress
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop policy if exists "Users can update their own alpaca progress" on public.alpaca_progress;
create policy "Users can update their own alpaca progress"
  on public.alpaca_progress
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  )
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false
  );

drop trigger if exists touch_alpaca_progress_updated_at on public.alpaca_progress;
create trigger touch_alpaca_progress_updated_at
  before update on public.alpaca_progress
  for each row
  execute function public.touch_alpaca_profile_updated_at();
