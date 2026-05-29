-- MVP schema: single landing per slug, password RPC admin, aggregate events.
-- Run in Supabase SQL Editor or via CLI after linking a project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.admin_credentials (
  id int primary key check (id = 1),
  password_hash text not null
);

create table public.landing_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  headline text not null,
  supporting_text text not null,
  bullets text[] not null default '{}'::text[],
  primary_button_label text not null,
  success_headline text not null,
  success_message text not null,
  footer_note text,
  form_name_required boolean not null default true,
  form_email_show boolean not null default false,
  form_email_required boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'primary_action_complete')),
  landing_slug text not null,
  created_at timestamptz not null default now()
);

create index analytics_events_slug_time_idx
  on public.analytics_events (landing_slug, created_at desc);

-- ---------------------------------------------------------------------------
-- Seed (change password in production: update admin_credentials)
-- ---------------------------------------------------------------------------

insert into public.admin_credentials (id, password_hash)
values (1, crypt('changeme', gen_salt('bf')));

insert into public.landing_content (
  slug,
  headline,
  supporting_text,
  bullets,
  primary_button_label,
  success_headline,
  success_message,
  footer_note,
  form_name_required,
  form_email_show,
  form_email_required
) values (
  'default',
  'Your headline',
  'Short supporting text. Tell them what to do in one breath.',
  array['First highlight', 'Second highlight'],
  'Send request',
  'You''re all set',
  'Thanks — we''ll follow up soon.',
  'Powered by your business',
  true,
  false,
  false
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.admin_credentials enable row level security;
alter table public.landing_content enable row level security;
alter table public.analytics_events enable row level security;

create policy "landing_content_public_select"
  on public.landing_content for select
  using (true);

create policy "admin_credentials_deny_all"
  on public.admin_credentials for all
  using (false);

create policy "analytics_events_deny_all"
  on public.analytics_events for all
  using (false);

-- ---------------------------------------------------------------------------
-- RPC: public
-- ---------------------------------------------------------------------------

create or replace function public.log_page_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.landing_content c where c.slug = p_slug) then
    return;
  end if;
  insert into public.analytics_events (event_type, landing_slug)
  values ('page_view', p_slug);
end;
$$;

create or replace function public.public_submit_primary_action(
  p_slug text,
  p_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.landing_content%rowtype;
begin
  select * into r from public.landing_content where slug = p_slug;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if r.form_name_required and (p_name is null or btrim(p_name) = '') then
    raise exception 'name_required' using errcode = 'P0002';
  end if;
  if r.form_email_show and r.form_email_required and (p_email is null or btrim(p_email) = '') then
    raise exception 'email_required' using errcode = 'P0003';
  end if;
  insert into public.analytics_events (event_type, landing_slug)
  values ('primary_action_complete', p_slug);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin (password verified inside; no Supabase Auth)
-- ---------------------------------------------------------------------------

create or replace function public.admin_verify_password(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select c.password_hash into v_hash from public.admin_credentials c where c.id = 1;
  if v_hash is null then
    return false;
  end if;
  return v_hash = crypt(p_password, v_hash);
end;
$$;

create or replace function public.admin_get_landing(p_password text, p_slug text)
returns setof public.landing_content
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_verify_password(p_password) then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;
  return query select * from public.landing_content where slug = p_slug;
end;
$$;

create or replace function public.admin_save_landing(
  p_password text,
  p_slug text,
  p_headline text,
  p_supporting_text text,
  p_bullets text[],
  p_primary_button_label text,
  p_success_headline text,
  p_success_message text,
  p_footer_note text,
  p_form_name_required boolean,
  p_form_email_show boolean,
  p_form_email_required boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_verify_password(p_password) then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;
  update public.landing_content
  set
    headline = p_headline,
    supporting_text = p_supporting_text,
    bullets = p_bullets,
    primary_button_label = p_primary_button_label,
    success_headline = p_success_headline,
    success_message = p_success_message,
    footer_note = nullif(btrim(p_footer_note), ''),
    form_name_required = p_form_name_required,
    form_email_show = p_form_email_show,
    form_email_required = p_form_email_required,
    updated_at = now()
  where slug = p_slug;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.admin_get_stats(
  p_password text,
  p_slug text,
  p_days int
)
returns table (
  visits bigint,
  completions bigint,
  conversion_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz;
  v_visits bigint;
  v_completions bigint;
begin
  if not public.admin_verify_password(p_password) then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;
  v_since := now() - make_interval(days => greatest(p_days, 1));
  select count(*) into v_visits
  from public.analytics_events e
  where e.landing_slug = p_slug
    and e.created_at >= v_since
    and e.event_type = 'page_view';
  select count(*) into v_completions
  from public.analytics_events e
  where e.landing_slug = p_slug
    and e.created_at >= v_since
    and e.event_type = 'primary_action_complete';
  visits := v_visits;
  completions := v_completions;
  conversion_pct := case when v_visits > 0 then round((v_completions::numeric / v_visits) * 100, 1) else 0 end;
  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.landing_content to anon, authenticated;

grant execute on function public.log_page_view(text) to anon, authenticated;
grant execute on function public.public_submit_primary_action(text, text, text) to anon, authenticated;
grant execute on function public.admin_verify_password(text) to anon, authenticated;
grant execute on function public.admin_get_landing(text, text) to anon, authenticated;
grant execute on function public.admin_save_landing(
  text, text, text, text, text[], text, text, text, text, boolean, boolean, boolean
) to anon, authenticated;
grant execute on function public.admin_get_stats(text, text, int) to anon, authenticated;
