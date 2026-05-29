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
