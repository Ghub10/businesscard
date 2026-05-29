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
