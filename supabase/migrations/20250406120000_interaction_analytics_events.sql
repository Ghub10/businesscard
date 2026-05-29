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
