import { supabase } from "./supabase";
import type { AdminStats, LandingContent } from "../types";

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("admin_verify_password", {
    p_password: password,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function adminFetchContent(
  password: string,
  slug: string
): Promise<LandingContent | null> {
  const { data, error } = await supabase.rpc("admin_get_landing", {
    p_password: password,
    p_slug: slug,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as LandingContent;
}

export type SaveLandingInput = Pick<
  LandingContent,
  | "headline"
  | "supporting_text"
  | "bullets"
  | "primary_button_label"
  | "success_headline"
  | "success_message"
  | "footer_note"
  | "form_name_required"
  | "form_email_show"
  | "form_email_required"
  | "cta_phone"
  | "cta_email"
>;

export async function adminSaveContent(
  password: string,
  slug: string,
  payload: SaveLandingInput
): Promise<void> {
  const { error } = await supabase.rpc("admin_save_landing", {
    p_password: password,
    p_slug: slug,
    p_headline: payload.headline,
    p_supporting_text: payload.supporting_text,
    p_bullets: payload.bullets,
    p_primary_button_label: payload.primary_button_label,
    p_success_headline: payload.success_headline,
    p_success_message: payload.success_message,
    p_footer_note: payload.footer_note,
    p_form_name_required: payload.form_name_required,
    p_form_email_show: payload.form_email_show,
    p_form_email_required: payload.form_email_required,
    p_cta_phone: payload.cta_phone ?? null,
    p_cta_email: payload.cta_email ?? null,
  });
  if (error) throw error;
}

export async function adminFetchStats(
  password: string,
  slug: string,
  days: number
): Promise<AdminStats> {
  const { data, error } = await supabase.rpc("admin_get_stats", {
    p_password: password,
    p_slug: slug,
    p_days: days,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    return {
      visits: 0,
      completions: 0,
      conversion_pct: 0,
      mailto_clicks: 0,
      tel_clicks: 0,
      linkedin_clicks: 0,
      sirnetz_clicks: 0,
      card_flip_opens: 0,
      card_flip_closes: 0,
    };
  }
  const r = row as Record<string, unknown>;
  return {
    visits: Number(r.visits ?? 0),
    completions: Number(r.completions ?? 0),
    conversion_pct: Number(r.conversion_pct ?? 0),
    mailto_clicks: Number(r.mailto_clicks ?? 0),
    tel_clicks: Number(r.tel_clicks ?? 0),
    linkedin_clicks: Number(r.linkedin_clicks ?? 0),
    sirnetz_clicks: Number(r.sirnetz_clicks ?? 0),
    card_flip_opens: Number(r.card_flip_opens ?? 0),
    card_flip_closes: Number(r.card_flip_closes ?? 0),
  };
}

export async function adminSubmitAction(
  slug: string,
  name: string | null,
  email: string | null
): Promise<void> {
  const { error } = await supabase.rpc("public_submit_primary_action", {
    p_slug: slug,
    p_name: name,
    p_email: email,
  });
  if (error) throw error;
}
