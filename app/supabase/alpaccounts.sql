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
  wsc_achievements jsonb not null default '[]'::jsonb,
  last_auth_provider text default 'email',
  auth_provider_id text,
  discord_user_id text,
  discord_username text,
  discord_global_name text,
  discord_avatar_url text,
  discord_connected_at timestamptz,
  last_sign_in_at timestamptz,
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
  add column if not exists wsc_achievements jsonb not null default '[]'::jsonb,
  add column if not exists last_auth_provider text default 'email',
  add column if not exists auth_provider_id text,
  add column if not exists discord_user_id text,
  add column if not exists discord_username text,
  add column if not exists discord_global_name text,
  add column if not exists discord_avatar_url text,
  add column if not exists discord_connected_at timestamptz,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.alpaca_profiles as profile
set email = lower(trim(auth_user.email))
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email is not null
  and (profile.email is null or trim(profile.email) = '')
  and not exists (
    select 1
    from public.alpaca_profiles as other_profile
    where other_profile.id <> profile.id
      and other_profile.email = lower(trim(auth_user.email))
  );

update public.alpaca_profiles as profile
set
  last_auth_provider = lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', profile.last_auth_provider, 'email'))),
  auth_provider_id = nullif(left(trim(coalesce(
    auth_user.raw_user_meta_data ->> 'provider_id',
    auth_user.raw_user_meta_data ->> 'sub',
    auth_user.raw_user_meta_data ->> 'id',
    profile.auth_provider_id,
    ''
  )), 128), ''),
  discord_user_id = case
    when lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', ''))) = 'discord'
      or coalesce(auth_user.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
      or lower(coalesce(auth_user.raw_user_meta_data ->> 'iss', '')) like '%discord%'
    then nullif(left(trim(coalesce(
      auth_user.raw_user_meta_data ->> 'provider_id',
      auth_user.raw_user_meta_data ->> 'sub',
      auth_user.raw_user_meta_data ->> 'id',
      profile.discord_user_id,
      ''
    )), 128), '')
    else profile.discord_user_id
  end,
  discord_username = case
    when lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', ''))) = 'discord'
      or coalesce(auth_user.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
      or lower(coalesce(auth_user.raw_user_meta_data ->> 'iss', '')) like '%discord%'
    then nullif(left(trim(coalesce(
      auth_user.raw_user_meta_data ->> 'user_name',
      auth_user.raw_user_meta_data ->> 'username',
      auth_user.raw_user_meta_data ->> 'preferred_username',
      auth_user.raw_user_meta_data ->> 'name',
      profile.discord_username,
      ''
    )), 120), '')
    else profile.discord_username
  end,
  discord_global_name = case
    when lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', ''))) = 'discord'
      or coalesce(auth_user.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
      or lower(coalesce(auth_user.raw_user_meta_data ->> 'iss', '')) like '%discord%'
    then nullif(left(trim(coalesce(
      auth_user.raw_user_meta_data ->> 'global_name',
      auth_user.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      auth_user.raw_user_meta_data ->> 'full_name',
      auth_user.raw_user_meta_data ->> 'name',
      profile.discord_global_name,
      ''
    )), 160), '')
    else profile.discord_global_name
  end,
  discord_avatar_url = case
    when lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', ''))) = 'discord'
      or coalesce(auth_user.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
      or lower(coalesce(auth_user.raw_user_meta_data ->> 'iss', '')) like '%discord%'
    then nullif(left(trim(coalesce(
      auth_user.raw_user_meta_data ->> 'avatar_url',
      auth_user.raw_user_meta_data ->> 'picture',
      profile.discord_avatar_url,
      ''
    )), 500), '')
    else profile.discord_avatar_url
  end,
  discord_connected_at = case
    when lower(trim(coalesce(auth_user.raw_app_meta_data ->> 'provider', ''))) = 'discord'
      or coalesce(auth_user.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
      or lower(coalesce(auth_user.raw_user_meta_data ->> 'iss', '')) like '%discord%'
    then coalesce(auth_user.last_sign_in_at, profile.discord_connected_at, now())
    else profile.discord_connected_at
  end,
  last_sign_in_at = coalesce(auth_user.last_sign_in_at, profile.last_sign_in_at)
from auth.users as auth_user
where profile.id = auth_user.id;

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
  last_auth_provider = coalesce(nullif(lower(trim(last_auth_provider)), ''), 'email'),
  wsc_achievements = case
    when jsonb_typeof(coalesce(wsc_achievements, '[]'::jsonb)) = 'array'
      then coalesce(wsc_achievements, '[]'::jsonb)
    else '[]'::jsonb
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
  alter column last_auth_provider set default 'email',
  alter column last_auth_provider set not null,
  alter column wsc_achievements set default '[]'::jsonb,
  alter column wsc_achievements set not null,
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

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.alpaca_profiles'::regclass
      and conname = 'alpaca_profiles_wsc_achievements_array_check'
  ) then
    alter table public.alpaca_profiles
      add constraint alpaca_profiles_wsc_achievements_array_check check (
        jsonb_typeof(wsc_achievements) = 'array'
      );
  end if;
end;
$$;

create index if not exists alpaca_profiles_discord_user_id_idx
  on public.alpaca_profiles (discord_user_id)
  where discord_user_id is not null;

create index if not exists alpaca_profiles_last_auth_provider_idx
  on public.alpaca_profiles (last_auth_provider, last_sign_in_at desc)
  where last_auth_provider is not null;

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
  clean_wsc_reward_type text := lower(replace(trim(coalesce(new.raw_user_meta_data ->> 'wsc_id_reward_type', 'none_yet')), '_', '-'));
  clean_wsc_reward_city text := trim(coalesce(new.raw_user_meta_data ->> 'wsc_id_reward_city', ''));
  clean_wsc_reward_date text := trim(coalesce(new.raw_user_meta_data ->> 'wsc_id_reward_date', ''));
  clean_wsc_achievement_round text := '';
  clean_wsc_achievements jsonb := coalesce(new.raw_user_meta_data -> 'wsc_achievements', '[]'::jsonb);
  clean_last_auth_provider text := lower(trim(coalesce(new.raw_app_meta_data ->> 'provider', 'email')));
  clean_auth_provider_id text := nullif(left(trim(coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub',
    new.raw_user_meta_data ->> 'id',
    ''
  )), 128), '');
  has_discord_identity boolean := lower(trim(coalesce(new.raw_app_meta_data ->> 'provider', ''))) = 'discord'
    or coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
    or lower(coalesce(new.raw_user_meta_data ->> 'iss', '')) like '%discord%';
  clean_discord_user_id text := null;
  clean_discord_username text := null;
  clean_discord_global_name text := null;
  clean_discord_avatar_url text := null;
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

  if exists (
    select 1
    from public.alpaca_profiles
    where email = clean_email
      and id <> new.id
  ) then
    clean_email := lower(replace(new.id::text, '-', '') || '@alpaccount.local');
  end if;

  if exists (
    select 1
    from public.alpaca_profiles
    where alpaca_name = clean_alpaca_name
      and id <> new.id
  ) then
    clean_alpaca_name := 'alpaca_' || left(replace(new.id::text, '-', ''), 24);
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

  if jsonb_typeof(clean_wsc_achievements) <> 'array' then
    clean_wsc_achievements := '[]'::jsonb;
  end if;

  if clean_wsc_reward_type = 'jac khor' or clean_wsc_reward_type = 'jackhor' then
    clean_wsc_reward_type := 'jac-khor';
  elsif clean_wsc_reward_type = 'gold' or clean_wsc_reward_type = 'gold medal' then
    clean_wsc_reward_type := 'gold-medal';
  elsif clean_wsc_reward_type = 'silver' or clean_wsc_reward_type = 'silver medal' then
    clean_wsc_reward_type := 'silver-medal';
  end if;

  if clean_wsc_reward_type not in ('none_yet', 'jac-khor', 'trophy', 'gold-medal', 'silver-medal') then
    clean_wsc_reward_type := 'none_yet';
  end if;

  if clean_last_auth_provider = '' then
    clean_last_auth_provider := 'email';
  end if;

  if has_discord_identity then
    clean_discord_user_id := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'sub',
      new.raw_user_meta_data ->> 'id',
      ''
    )), 128), '');
    clean_discord_username := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'name',
      ''
    )), 120), '');
    clean_discord_global_name := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'global_name',
      new.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), 160), '');
    clean_discord_avatar_url := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )), 500), '');
  end if;

  clean_wsc_achievement_round := case clean_highest_wsc_round
    when 'regional_round' then 'regional'
    when 'global_round' then 'global'
    when 'tournament_of_champions' then 'toc'
    else ''
  end;

  if jsonb_array_length(clean_wsc_achievements) = 0
    and clean_wsc_reward_type <> 'none_yet'
    and clean_wsc_achievement_round <> ''
    and clean_wsc_reward_city <> ''
    and clean_wsc_reward_date <> ''
  then
    clean_wsc_achievements := jsonb_build_array(jsonb_build_object(
      'fullName', '',
      'rewardType', clean_wsc_reward_type,
      'round', clean_wsc_achievement_round,
      'city', clean_wsc_reward_city,
      'approximateDate', clean_wsc_reward_date
    ));
  end if;

  insert into public.alpaca_profiles (
    id,
    alpaca_name,
    email,
    country,
    school_name,
    wsc_event_count,
    highest_wsc_round,
    wsc_achievements,
    last_auth_provider,
    auth_provider_id,
    discord_user_id,
    discord_username,
    discord_global_name,
    discord_avatar_url,
    discord_connected_at,
    last_sign_in_at
  )
  values (
    new.id,
    clean_alpaca_name,
    clean_email,
    clean_country,
    clean_school_name,
    clean_wsc_event_count,
    clean_highest_wsc_round,
    clean_wsc_achievements,
    clean_last_auth_provider,
    clean_auth_provider_id,
    clean_discord_user_id,
    clean_discord_username,
    clean_discord_global_name,
    clean_discord_avatar_url,
    case when has_discord_identity then coalesce(new.last_sign_in_at, now()) else null end,
    new.last_sign_in_at
  )
  on conflict (id) do update
    set
      alpaca_name = excluded.alpaca_name,
      email = excluded.email,
      country = excluded.country,
      school_name = excluded.school_name,
      wsc_event_count = excluded.wsc_event_count,
      highest_wsc_round = excluded.highest_wsc_round,
      wsc_achievements = excluded.wsc_achievements,
      last_auth_provider = excluded.last_auth_provider,
      auth_provider_id = excluded.auth_provider_id,
      discord_user_id = coalesce(excluded.discord_user_id, public.alpaca_profiles.discord_user_id),
      discord_username = coalesce(excluded.discord_username, public.alpaca_profiles.discord_username),
      discord_global_name = coalesce(excluded.discord_global_name, public.alpaca_profiles.discord_global_name),
      discord_avatar_url = coalesce(excluded.discord_avatar_url, public.alpaca_profiles.discord_avatar_url),
      discord_connected_at = coalesce(excluded.discord_connected_at, public.alpaca_profiles.discord_connected_at),
      last_sign_in_at = coalesce(excluded.last_sign_in_at, public.alpaca_profiles.last_sign_in_at),
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

create table if not exists public.alpaca_auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  discord_user_id text,
  discord_username text,
  discord_global_name text,
  discord_avatar_url text,
  event_type text not null default 'sign_in',
  created_at timestamptz not null default now()
);

alter table public.alpaca_auth_events
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists provider text,
  add column if not exists provider_user_id text,
  add column if not exists discord_user_id text,
  add column if not exists discord_username text,
  add column if not exists discord_global_name text,
  add column if not exists discord_avatar_url text,
  add column if not exists event_type text default 'sign_in',
  add column if not exists created_at timestamptz default now();

update public.alpaca_auth_events
set
  provider = coalesce(nullif(lower(trim(provider)), ''), 'unknown'),
  event_type = coalesce(nullif(lower(trim(event_type)), ''), 'sign_in'),
  created_at = coalesce(created_at, now());

alter table public.alpaca_auth_events
  alter column user_id set not null,
  alter column provider set default 'unknown',
  alter column provider set not null,
  alter column event_type set default 'sign_in',
  alter column event_type set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.alpaca_auth_events enable row level security;
revoke all on public.alpaca_auth_events from anon, authenticated;

create index if not exists alpaca_auth_events_user_created_idx
  on public.alpaca_auth_events (user_id, created_at desc);

create index if not exists alpaca_auth_events_discord_created_idx
  on public.alpaca_auth_events (created_at desc)
  where provider = 'discord';

create or replace function public.sync_alpaca_profile_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_email text := lower(trim(coalesce(new.email, '')));
  clean_last_auth_provider text := lower(trim(coalesce(new.raw_app_meta_data ->> 'provider', 'email')));
  clean_auth_provider_id text := nullif(left(trim(coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub',
    new.raw_user_meta_data ->> 'id',
    ''
  )), 128), '');
  has_discord_identity boolean := lower(trim(coalesce(new.raw_app_meta_data ->> 'provider', ''))) = 'discord'
    or coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'discord'
    or lower(coalesce(new.raw_user_meta_data ->> 'iss', '')) like '%discord%';
  clean_discord_user_id text := null;
  clean_discord_username text := null;
  clean_discord_global_name text := null;
  clean_discord_avatar_url text := null;
  should_record_event boolean := false;
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  if clean_last_auth_provider = '' then
    clean_last_auth_provider := 'email';
  end if;

  if clean_email = '' then
    clean_email := lower(replace(new.id::text, '-', '') || '@alpaccount.local');
  end if;

  if exists (
    select 1
    from public.alpaca_profiles
    where email = clean_email
      and id <> new.id
  ) then
    clean_email := lower(replace(new.id::text, '-', '') || '@alpaccount.local');
  end if;

  if has_discord_identity then
    clean_discord_user_id := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'sub',
      new.raw_user_meta_data ->> 'id',
      ''
    )), 128), '');
    clean_discord_username := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'name',
      ''
    )), 120), '');
    clean_discord_global_name := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'global_name',
      new.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), 160), '');
    clean_discord_avatar_url := nullif(left(trim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )), 500), '');
  end if;

  insert into public.alpaca_profiles (
    id,
    alpaca_name,
    email,
    country,
    school_name,
    wsc_event_count,
    highest_wsc_round,
    wsc_achievements,
    last_auth_provider,
    auth_provider_id,
    discord_user_id,
    discord_username,
    discord_global_name,
    discord_avatar_url,
    discord_connected_at,
    last_sign_in_at
  )
  values (
    new.id,
    'alpaca_' || left(replace(new.id::text, '-', ''), 24),
    clean_email,
    'Unknown',
    'Unknown school',
    0,
    'none_yet',
    '[]'::jsonb,
    clean_last_auth_provider,
    clean_auth_provider_id,
    clean_discord_user_id,
    clean_discord_username,
    clean_discord_global_name,
    clean_discord_avatar_url,
    case when has_discord_identity then coalesce(new.last_sign_in_at, now()) else null end,
    new.last_sign_in_at
  )
  on conflict (id) do update
    set
      last_auth_provider = excluded.last_auth_provider,
      auth_provider_id = excluded.auth_provider_id,
      discord_user_id = coalesce(excluded.discord_user_id, public.alpaca_profiles.discord_user_id),
      discord_username = coalesce(excluded.discord_username, public.alpaca_profiles.discord_username),
      discord_global_name = coalesce(excluded.discord_global_name, public.alpaca_profiles.discord_global_name),
      discord_avatar_url = coalesce(excluded.discord_avatar_url, public.alpaca_profiles.discord_avatar_url),
      discord_connected_at = coalesce(excluded.discord_connected_at, public.alpaca_profiles.discord_connected_at),
      last_sign_in_at = coalesce(excluded.last_sign_in_at, public.alpaca_profiles.last_sign_in_at),
      updated_at = now();

  if tg_op = 'INSERT' then
    should_record_event := new.last_sign_in_at is not null;
  elsif tg_op = 'UPDATE' then
    should_record_event := new.last_sign_in_at is not null
      and new.last_sign_in_at is distinct from old.last_sign_in_at;
  end if;

  if should_record_event then
    insert into public.alpaca_auth_events (
      user_id,
      provider,
      provider_user_id,
      discord_user_id,
      discord_username,
      discord_global_name,
      discord_avatar_url,
      event_type
    )
    values (
      new.id,
      clean_last_auth_provider,
      clean_auth_provider_id,
      clean_discord_user_id,
      clean_discord_username,
      clean_discord_global_name,
      clean_discord_avatar_url,
      'sign_in'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_alpaca_profile_auth_identity on auth.users;
create trigger sync_alpaca_profile_auth_identity
  after insert or update of raw_app_meta_data, raw_user_meta_data, email, last_sign_in_at on auth.users
  for each row
  execute function public.sync_alpaca_profile_auth_identity();

revoke all on function public.sync_alpaca_profile_auth_identity() from public;

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
