-- Run once in Supabase > SQL Editor. Safe to run again; no existing progress is dropped.
begin;

create table if not exists public.study_profiles (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now()
);
create table if not exists public.study_devices (
  user_id uuid primary key, profile_id uuid not null references public.study_profiles(id) on delete cascade
);
create index if not exists study_devices_profile on public.study_devices(profile_id);
create table if not exists public.study_baselines (
  profile_id uuid not null references public.study_profiles(id) on delete cascade,
  question_id text not null check (length(question_id) between 1 and 120),
  attempts integer not null check (attempts between 1 and 100000),
  mastered boolean not null, changed_at timestamptz not null, source_date timestamptz not null,
  primary key (profile_id, question_id)
);
create table if not exists public.study_events (
  profile_id uuid not null references public.study_profiles(id) on delete cascade,
  event_id uuid not null, question_id text not null check (length(question_id) between 1 and 120),
  mastered boolean not null, changed_at timestamptz not null,
  primary key (profile_id, event_id)
);
create index if not exists study_events_question on public.study_events(profile_id, question_id);
create table if not exists public.study_links (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null,
  token_hash text unique not null, created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  confirmed_at timestamptz, cancelled_at timestamptz
);
create index if not exists study_links_requester on public.study_links(requester_id, created_at);

alter table public.study_profiles enable row level security;
alter table public.study_devices enable row level security;
alter table public.study_baselines enable row level security;
alter table public.study_events enable row level security;
alter table public.study_links enable row level security;
-- Browser access is ONLY through the scoped functions below. No direct table grants.
revoke all on public.study_profiles, public.study_devices, public.study_baselines, public.study_events, public.study_links from public, anon, authenticated;

create or replace function public.study_ensure_profile() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); pid uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 10));
  select profile_id into pid from public.study_devices where user_id = uid;
  if pid is null then
    insert into public.study_profiles default values returning id into pid;
    insert into public.study_devices(user_id, profile_id) values (uid, pid);
  end if;
  return pid;
end;
$$;
revoke all on function public.study_ensure_profile() from public, anon, authenticated;

create or replace function public.study_sync(p_baseline jsonb default '{}'::jsonb, p_events jsonb default '[]'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare pid uuid; item record; event jsonb; dt timestamptz; original_dt timestamptz; output jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_baseline) <> 'object' or jsonb_typeof(p_events) <> 'array' or p_baseline is null or p_events is null then raise exception 'Invalid payload'; end if;
  if octet_length(p_baseline::text) > 250000 or octet_length(p_events::text) > 100000 or jsonb_array_length(p_events) > 200 or (select count(*) from jsonb_object_keys(p_baseline)) > 1000 then raise exception 'Payload too large'; end if;
  pid := public.study_ensure_profile();
  perform pg_advisory_xact_lock(hashtextextended(pid::text, 20));
  for item in select key, value from jsonb_each(p_baseline) loop
    if item.key !~ '^[a-zA-Z0-9_-]{1,120}$' or jsonb_typeof(item.value->'mastered') is distinct from 'boolean' or jsonb_typeof(item.value->'attempts') is distinct from 'number' or jsonb_typeof(item.value->'date') is distinct from 'string' then raise exception 'Invalid baseline'; end if;
    if (item.value->>'attempts')::numeric not between 1 and 100000 or trunc((item.value->>'attempts')::numeric) <> (item.value->>'attempts')::numeric then raise exception 'Invalid attempts'; end if;
    original_dt := (item.value->>'date')::timestamptz;
    dt := least(original_dt, clock_timestamp());
    if not isfinite(original_dt) or dt < '1970-01-01'::timestamptz then raise exception 'Invalid date'; end if;
    insert into public.study_baselines as b (profile_id, question_id, attempts, mastered, changed_at, source_date)
    values (pid, item.key, (item.value->>'attempts')::integer, (item.value->>'mastered')::boolean, dt, original_dt)
    on conflict (profile_id, question_id) do update set
      attempts = greatest(b.attempts, excluded.attempts),
      mastered = case when excluded.source_date > b.source_date then excluded.mastered when excluded.source_date = b.source_date then b.mastered and excluded.mastered else b.mastered end,
      changed_at = case when excluded.source_date > b.source_date then excluded.changed_at else b.changed_at end,
      source_date = greatest(b.source_date, excluded.source_date)
      where excluded.attempts > b.attempts or excluded.source_date > b.source_date or (excluded.source_date = b.source_date and b.mastered and not excluded.mastered);
  end loop;
  for event in select value from jsonb_array_elements(p_events) loop
    if jsonb_typeof(event->'mastered') is distinct from 'boolean' or jsonb_typeof(event->'date') is distinct from 'string' or (event->>'questionId') is null or (event->>'questionId') !~ '^[a-zA-Z0-9_-]{1,120}$' or (event->>'id') is null then raise exception 'Invalid event'; end if;
    dt := least((event->>'date')::timestamptz, clock_timestamp());
    if not isfinite(dt) or dt < '1970-01-01'::timestamptz then raise exception 'Invalid date'; end if;
    insert into public.study_events(profile_id, event_id, question_id, mastered, changed_at)
      values (pid, (event->>'id')::uuid, event->>'questionId', (event->>'mastered')::boolean, dt)
      on conflict (profile_id, event_id) do nothing;
  end loop;
  with states as (
    select question_id, attempts as baseline_attempts, mastered, changed_at, false as is_event, '' as event_key
      from public.study_baselines where profile_id = pid
    union all
    select question_id, 0, mastered, changed_at, true, event_id::text
      from public.study_events where profile_id = pid
  ), ranked as (
    select *, row_number() over (partition by question_id order by changed_at desc, is_event desc, mastered asc, event_key desc) as position,
      max(baseline_attempts) over (partition by question_id) + count(*) filter (where is_event) over (partition by question_id) as total_attempts
    from states
  ) select coalesce(jsonb_object_agg(question_id, jsonb_build_object('attempts', total_attempts, 'mastered', mastered, 'date', changed_at)), '{}'::jsonb)
      into output from ranked where position = 1;
  return jsonb_build_object('profileId', pid, 'devices', (select count(*) from public.study_devices where profile_id = pid), 'progress', output);
end;
$$;
revoke all on function public.study_sync(jsonb, jsonb) from public, anon;
grant execute on function public.study_sync(jsonb, jsonb) to authenticated;

create or replace function public.study_create_link() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); token text; rid uuid; expiry timestamptz;
begin
  perform public.study_ensure_profile();
  if (select count(*) from public.study_links where requester_id = uid and created_at > now() - interval '1 hour') >= 10 then raise exception 'Too many links; try later'; end if;
  update public.study_links set cancelled_at = now() where requester_id = uid and confirmed_at is null and cancelled_at is null;
  delete from public.study_links where requester_id = uid and created_at < now() - interval '1 day';
  token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.study_links(requester_id, token_hash) values (uid, encode(sha256(convert_to(token, 'UTF8')), 'hex')) returning id, expires_at into rid, expiry;
  return jsonb_build_object('id', rid, 'token', token, 'expiresAt', expiry);
end;
$$;
revoke all on function public.study_create_link() from public, anon;
grant execute on function public.study_create_link() to authenticated;

create or replace function public.study_link_status(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare link public.study_links;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into link from public.study_links where id = p_id and requester_id = auth.uid();
  if not found then return 'unavailable'; end if;
  if link.confirmed_at is not null then return 'confirmed'; end if;
  if link.cancelled_at is not null then return 'cancelled'; end if;
  if link.expires_at <= now() then return 'expired'; end if;
  return 'pending';
end;
$$;
revoke all on function public.study_link_status(uuid) from public, anon;
grant execute on function public.study_link_status(uuid) to authenticated;

create or replace function public.study_cancel_link(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.study_links set cancelled_at = now() where id = p_id and requester_id = auth.uid() and confirmed_at is null;
end;
$$;
revoke all on function public.study_cancel_link(uuid) from public, anon;
grant execute on function public.study_cancel_link(uuid) to authenticated;

create or replace function public.study_confirm_link(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare link public.study_links; target uuid; old_profile uuid; key text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid or expired link'; end if;
  select * into link from public.study_links where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') for update;
  if not found or link.confirmed_at is not null or link.cancelled_at is not null or link.expires_at <= now() then raise exception 'Invalid or expired link'; end if;
  if link.requester_id = auth.uid() then raise exception 'Use the other device to confirm'; end if;
  target := public.study_ensure_profile();
  perform pg_advisory_xact_lock(hashtextextended(link.requester_id::text, 10));
  select profile_id into old_profile from public.study_devices where user_id = link.requester_id;
  if old_profile is null then raise exception 'Device unavailable'; end if;
  for key in select value from unnest(array[target::text, old_profile::text]) as value order by value loop
    perform pg_advisory_xact_lock(hashtextextended(key, 20));
  end loop;
  if old_profile <> target then
    if (select count(*) from public.study_devices where profile_id = old_profile) > 1 then raise exception 'Device already belongs to another shared profile'; end if;
    -- Merge instead of replacing either device's progress. Event UUIDs make retries idempotent.
    insert into public.study_baselines as b select target, question_id, attempts, mastered, changed_at, source_date from public.study_baselines where profile_id = old_profile
    on conflict (profile_id, question_id) do update set
      attempts = greatest(b.attempts, excluded.attempts),
      mastered = case when excluded.source_date > b.source_date then excluded.mastered when excluded.source_date = b.source_date then b.mastered and excluded.mastered else b.mastered end,
      changed_at = case when excluded.source_date > b.source_date then excluded.changed_at else b.changed_at end,
      source_date = greatest(b.source_date, excluded.source_date)
      where excluded.attempts > b.attempts or excluded.source_date > b.source_date or (excluded.source_date = b.source_date and b.mastered and not excluded.mastered);
    insert into public.study_events select target, event_id, question_id, mastered, changed_at from public.study_events where profile_id = old_profile on conflict do nothing;
    update public.study_devices set profile_id = target where user_id = link.requester_id;
    delete from public.study_profiles where id = old_profile and not exists(select 1 from public.study_devices where profile_id = old_profile);
  end if;
  update public.study_links set confirmed_at = now() where id = link.id;
end;
$$;
revoke all on function public.study_confirm_link(text) from public, anon;
grant execute on function public.study_confirm_link(text) to authenticated;

commit;
