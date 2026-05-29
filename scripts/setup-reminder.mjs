import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const migration = resolve(root, "supabase/migrations/20250327000000_init.sql");

console.log("Businesscard2026 — setup checklist\n");
const allMigrations = resolve(root, "supabase/RUN_ALL_MIGRATIONS.sql");
console.log("1. Supabase SQL Editor: paste and run (all migrations in order):");
console.log("   ", allMigrations);
console.log("   (or run files under supabase/migrations/ one by one; init is", migration + ")");
console.log("");
console.log("2. Supabase → Project Settings → API — remove .env placeholders:");
console.log("   VITE_SUPABASE_URL     ← Project URL");
console.log("   VITE_SUPABASE_ANON_KEY ← anon public key (not service_role)");
console.log("   VITE_PUBLIC_SLUG      ← default (or match landing_content.slug)");
console.log("");

const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.log("3. No .env yet — run:  cp .env.example .env");
} else {
  const raw = readFileSync(envPath, "utf8");
  const needsKeys =
    raw.includes("YOUR_PROJECT") || raw.includes("your_anon_key");
  if (needsKeys) {
    console.log("3. Edit .env: replace YOUR_PROJECT + your_anon_key with dashboard values; save; restart npm run dev");
  } else {
    console.log("3. .env looks configured — run: npm run check:supabase");
    console.log("   Then restart npm run dev after any .env change");
  }
}

const DEV_PORT = 5626;
console.log("");
console.log("4. From this folder: npm install && npm run dev  (always restart after .env changes)");
console.log(`   Prefer http://localhost:${DEV_PORT} for this repo (not :5173 — avoids CDL-Drivers / other apps).`);
console.log("   If that port is busy, use the exact “Local” URL Vite prints in the terminal.");
console.log(`   Public: http://localhost:${DEV_PORT}/p/default   Admin: http://localhost:${DEV_PORT}/admin`);
console.log("   Password after migration: changeme");
console.log("");
