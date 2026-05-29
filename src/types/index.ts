export type LandingContent = {
  id: string;
  slug: string;
  headline: string;
  supporting_text: string;
  bullets: string[];
  primary_button_label: string;
  success_headline: string;
  success_message: string;
  footer_note: string | null;
  form_name_required: boolean;
  form_email_show: boolean;
  form_email_required: boolean;
  cta_phone: string | null;
  cta_email: string | null;
  updated_at: string;
};

export type AdminStats = {
  visits: number;
  completions: number;
  conversion_pct: number;
  mailto_clicks: number;
  tel_clicks: number;
  linkedin_clicks: number;
  sirnetz_clicks: number;
  card_flip_opens: number;
  card_flip_closes: number;
};
