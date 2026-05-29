import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import type { LandingContent } from "../types";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

/** True when the browser never received a normal HTTP response (transport/DNS/CORS/extension), not PostgREST JSON errors. */
export function isSupabaseNetworkFailure(err: unknown): boolean {
  const m =
    err && typeof err === "object" && "message" in err
      ? String((err as Error).message)
      : String(err ?? "");
  return (
    /failed to fetch/i.test(m) ||
    /networkerror/i.test(m) ||
    /load failed/i.test(m) ||
    /network request failed/i.test(m)
  );
}

/** Human-readable text for UI when a PostgREST request fails. */
export function describeSupabaseError(err: unknown): string {
  if (!err || typeof err !== "object") return "Request failed.";
  const e = err as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  const parts = [e.message, e.details, e.hint].filter(Boolean);
  const s = parts.join(" — ");
  if (!s) return "Request failed.";
  if (isSupabaseNetworkFailure(err)) {
    return `${s} — The browser never reached your Supabase project (URL, network, VPN/firewall, or an extension blocking the request). This is usually not a missing SQL migration or RLS issue.`;
  }
  if (s.includes("landing_content") && (s.includes("schema cache") || s.includes("does not exist"))) {
    return `${s} (Run supabase/migrations/…sql in the Supabase SQL editor.)`;
  }
  return s;
}

export async function fetchLandingBySlug(slug: string): Promise<LandingContent | null> {
  const { data, error } = await supabase
    .from("landing_content")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as LandingContent | null;
}

export async function logPageViewRpc(slug: string): Promise<void> {
  const { error } = await supabase.rpc("log_page_view", { p_slug: slug });
  if (error) console.error("logPageView", error);
}

/** Logged via `log_interaction_event` RPC — keep in sync with migration check constraint */
export const interactionEventTypes = [
  "mailto_click",
  "tel_click",
  "linkedin_click",
  "sirnetz_click",
  "card_flip_open",
  "card_flip_close",
] as const;

export type InteractionEventType = (typeof interactionEventTypes)[number];

export async function logInteractionEventRpc(
  slug: string,
  eventType: InteractionEventType
): Promise<void> {
  if (!slug) return;
  const { error } = await supabase.rpc("log_interaction_event", {
    p_slug: slug,
    p_event_type: eventType,
  });
  if (error) console.error("logInteractionEvent", eventType, error);
}
