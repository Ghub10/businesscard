import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lookup } from "node:dns/promises";

const root = fileURLToPath(new URL("..", import.meta.url));
const envPath = resolve(root, ".env");

function loadDotEnv() {
  if (!existsSync(envPath)) {
    console.error("No .env file — copy .env.example to .env and add your Supabase keys.");
    process.exit(1);
  }
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function looksLikeJwt(key) {
  const parts = key.split(".");
  return key.startsWith("eyJ") && parts.length === 3 && parts.every((p) => p.length > 0);
}

function parseProjectUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!u.hostname.endsWith(".supabase.co")) return null;
    return u;
  } catch {
    return null;
  }
}

const env = loadDotEnv();
const url = (env.VITE_SUPABASE_URL ?? "").trim();
const key = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const slug = (env.VITE_PUBLIC_SLUG ?? "default").trim() || "default";

console.log("Supabase connectivity check\n");

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}
if (/YOUR_PROJECT|your_project/i.test(url) || /^your_anon_key$/i.test(key)) {
  console.error("Replace placeholder values in .env with Project Settings → API values.");
  process.exit(1);
}
if (!parseProjectUrl(url)) {
  console.error(
    "VITE_SUPABASE_URL must be https://<ref>.supabase.co with no path or trailing slash."
  );
  process.exit(1);
}
if (!looksLikeJwt(key)) {
  console.error("VITE_SUPABASE_ANON_KEY should be the anon public JWT (starts with eyJ).");
  process.exit(1);
}

const parsed = new URL(url);
const host = parsed.hostname;
console.log(`Project host: ${host}`);

try {
  await lookup(host);
  console.log("DNS: OK");
} catch (e) {
  console.error(`DNS: FAILED (${e.code ?? e.message})`);
  console.error(
    "This hostname does not resolve. Open Supabase dashboard → confirm the project exists and is not paused."
  );
  console.error("Copy a fresh Project URL from Settings → API into VITE_SUPABASE_URL, then restart npm run dev.");
  process.exit(1);
}

const rest = `${url.replace(/\/$/, "")}/rest/v1/landing_content?slug=eq.${encodeURIComponent(slug)}&select=slug`;
console.log(`GET ${rest.replace(key, "[anon]")}`);

let res;
try {
  res = await fetch(rest, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
} catch (e) {
  console.error(`HTTP: FAILED (${e.message})`);
  process.exit(1);
}

const body = await res.text();
console.log(`HTTP: ${res.status}`);

if (res.status === 200) {
  console.log("landing_content: reachable (check slug row in response).");
  process.exit(0);
}
if (res.status === 404 || body.includes("PGRST") || body.includes("schema cache")) {
  console.log("API reachable — run supabase/RUN_ALL_MIGRATIONS.sql in the SQL Editor, then retry.");
  process.exit(0);
}
if (res.status === 401 || res.status === 403) {
  console.error("Key/URL mismatch — paste anon public key and Project URL from the same project.");
  process.exit(1);
}

console.log(body.slice(0, 400));
process.exit(res.ok ? 0 : 1);
