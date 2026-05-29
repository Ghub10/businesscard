-- Run once in Supabase SQL Editor (all migrations in order)
-- Generated from supabase/migrations/*.sql

-- ========== supabase/migrations/20250327000000_init.sql ==========
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


-- ========== supabase/migrations/20250401000000_add_cta_contact.sql ==========
-- Add phone and email CTA link buttons to landing_content.
-- Run this in the Supabase SQL Editor AFTER the initial migration (20250327000000_init.sql).

alter table public.landing_content
  add column if not exists cta_phone text,
  add column if not exists cta_email text;

-- Seed the default row with initial values; edit anytime in the admin.
update public.landing_content
set
  cta_phone = '+1 (385) 515-2421',
  cta_email = 'aabonnanzieri@gmail.com'
where slug = 'default';

-- Replace admin_save_landing to accept the two new optional fields.
-- New params use defaults so existing saved state is unchanged on first call.
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
  p_form_email_required boolean,
  p_cta_phone text default null,
  p_cta_email text default null
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
    footer_note = nullif(btrim(coalesce(p_footer_note, '')), ''),
    form_name_required = p_form_name_required,
    form_email_show = p_form_email_show,
    form_email_required = p_form_email_required,
    cta_phone = nullif(btrim(coalesce(p_cta_phone, '')), ''),
    cta_email = nullif(btrim(coalesce(p_cta_email, '')), ''),
    updated_at = now()
  where slug = p_slug;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

-- Grant execute on the new extended signature.
grant execute on function public.admin_save_landing(
  text, text, text, text, text[], text, text, text, text, boolean, boolean, boolean, text, text
) to anon, authenticated;


-- ========== supabase/migrations/20250406120000_interaction_analytics_events.sql ==========
-- Extra analytics: CTA clicks + card flip. Apply after init migration.

alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;

alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in (
    'page_view',
    'primary_action_complete',
    'mailto_click',
    'tel_click',
    'linkedin_click',
    'sirnetz_click',
    'card_flip_open',
    'card_flip_close'
  ));

create or replace function public.log_interaction_event(p_slug text, p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in (
    'mailto_click',
    'tel_click',
    'linkedin_click',
    'sirnetz_click',
    'card_flip_open',
    'card_flip_close'
  ) then
    return;
  end if;
  if not exists (select 1 from public.landing_content c where c.slug = p_slug) then
    return;
  end if;
  insert into public.analytics_events (event_type, landing_slug)
  values (p_event_type, p_slug);
end;
$$;

grant execute on function public.log_interaction_event(text, text) to anon, authenticated;


-- ========== supabase/migrations/20250406130000_admin_stats_interaction_counts.sql ==========
-- Richer admin stats: counts per interaction event in the selected window.
-- Requires 20250406120000_interaction_analytics_events.sql (event_type values).

create or replace function public.admin_get_stats(
  p_password text,
  p_slug text,
  p_days int
)
returns table (
  visits bigint,
  completions bigint,
  conversion_pct numeric,
  mailto_clicks bigint,
  tel_clicks bigint,
  linkedin_clicks bigint,
  sirnetz_clicks bigint,
  card_flip_opens bigint,
  card_flip_closes bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz;
  agg record;
begin
  if not public.admin_verify_password(p_password) then
    raise exception 'unauthorized' using errcode = 'P0401';
  end if;
  v_since := now() - make_interval(days => greatest(p_days, 1));

  select
    count(*) filter (where e.event_type = 'page_view') as c_visits,
    count(*) filter (where e.event_type = 'primary_action_complete') as c_completions,
    count(*) filter (where e.event_type = 'mailto_click') as c_mailto,
    count(*) filter (where e.event_type = 'tel_click') as c_tel,
    count(*) filter (where e.event_type = 'linkedin_click') as c_linkedin,
    count(*) filter (where e.event_type = 'sirnetz_click') as c_sirnetz,
    count(*) filter (where e.event_type = 'card_flip_open') as c_flip_open,
    count(*) filter (where e.event_type = 'card_flip_close') as c_flip_close
  into agg
  from public.analytics_events e
  where e.landing_slug = p_slug
    and e.created_at >= v_since;

  visits := coalesce(agg.c_visits, 0);
  completions := coalesce(agg.c_completions, 0);
  conversion_pct := case
    when visits > 0 then round((completions::numeric / visits) * 100, 1)
    else 0
  end;
  mailto_clicks := coalesce(agg.c_mailto, 0);
  tel_clicks := coalesce(agg.c_tel, 0);
  linkedin_clicks := coalesce(agg.c_linkedin, 0);
  sirnetz_clicks := coalesce(agg.c_sirnetz, 0);
  card_flip_opens := coalesce(agg.c_flip_open, 0);
  card_flip_closes := coalesce(agg.c_flip_close, 0);
  return next;
end;
$$;

grant execute on function public.admin_get_stats(text, text, int) to anon, authenticated;


