function readEnv(key: keyof ImportMetaEnv): string {
  const v = import.meta.env[key] as string | undefined;
  const s = (v ?? "").trim();
  if (!s) console.warn(`Missing or empty env: ${String(key)}`);
  return s;
}

export const env = {
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
};

/** null = credentials look real enough to call Supabase. */
export type SupabaseEnvIssue =
  | "missing"
  | "placeholder"
  | "invalid_url"
  | "invalid_key"
  | null;

function looksLikeJwt(key: string): boolean {
  const parts = key.split(".");
  return key.startsWith("eyJ") && parts.length === 3 && parts.every((p) => p.length > 0);
}

function parseSupabaseProjectUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!u.hostname.endsWith(".supabase.co")) return null;
    if (u.pathname !== "/" && u.pathname !== "") return null;
    if (u.search || u.hash) return null;
    return u;
  } catch {
    return null;
  }
}

/** Hostname only (for dev diagnostics; never includes the anon key). */
export function getSupabaseDisplayHost(): string | null {
  const u = parseSupabaseProjectUrl(env.supabaseUrl);
  return u?.hostname ?? null;
}

export function getSupabaseEnvIssue(): SupabaseEnvIssue {
  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;
  if (!url || !key) return "missing";
  const placeholderUrl = /YOUR_PROJECT|your_project/i.test(url);
  const placeholderKey = /^your_anon_key$/i.test(key);
  if (placeholderUrl || placeholderKey) return "placeholder";
  if (!parseSupabaseProjectUrl(url)) return "invalid_url";
  if (!looksLikeJwt(key)) return "invalid_key";
  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnvIssue() === null;
}
