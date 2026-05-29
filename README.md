# Businesscard 2026 (MVP)

QR-first **client landing page**: visitors read your copy and complete **one primary action** (no client login). You edit content behind a **password** and see simple **visit + completion** totals.

## Primary action (MVP)

**Minimal form** → success: optional name, optional email (configured in admin). The server records a **`primary_action_complete`** event only; form answers are **not stored** (privacy + scope). Other patterns (external booking link only, etc.) are out of scope for this build.

## Stack

- Vite, React 19, TypeScript, Tailwind CSS 4, React Router 7, TanStack Query
- **Supabase** (Postgres + RLS + `SECURITY DEFINER` RPCs for admin and events)

## Local setup

1. **Create a Supabase project** and copy the project URL + anon key.

2. **Apply the schema** — in the Supabase SQL editor, run the migration file:

   `supabase/migrations/20250327000000_init.sql`

3. **Change the default admin password** (required before production):

   ```sql
   update admin_credentials
   set password_hash = crypt('your-strong-password', gen_salt('bf'))
   where id = 1;
   ```

   The seeded password is **`changeme`**.

4. **Environment**

   ```bash
   cp .env.example .env
   npm install
   npm run setup   # prints migration path + .env checklist
   ```

### Replacing placeholders in `.env`

Open [Supabase](https://supabase.com/dashboard) → your project → **Project Settings** → **API**.

| Variable | Paste from dashboard |
|----------|----------------------|
| `VITE_SUPABASE_URL` | **Project URL** (`https://…supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **anon** **public** key (not `service_role`) |

Edit `.env`: remove `YOUR_PROJECT` / `your_anon_key`, save. Keep `VITE_PUBLIC_SLUG=default` unless you use another slug in `landing_content`. **Do not commit** `.env` with real keys.

Then **restart** `npm run dev` (Vite only reads `VITE_*` at startup).

5. From this repo only, run `npm run dev`. Vite **prefers port 5626** (not 5173, so another project like CDL-Drivers can own 5173). If 5626 is busy, check the terminal for the actual “Local” URL.  
   Open **public**: `http://localhost:5626/p/<slug>` (e.g. `/p/default`).  
   **Admin**: `http://localhost:5626/admin` (password from step 3).

## Troubleshooting: `TypeError: Failed to fetch`

That message means the **browser never got a normal HTTP response** from your `VITE_SUPABASE_URL` (a transport/network problem). It is **usually not** a missing migration or RLS issue—those tend to return JSON errors from PostgREST.

1. **DevTools → Network**: reload `/p/…`, inspect the request to `…supabase.co/rest/v1/…` (failed, blocked, CORS).
2. **URL**: paste `VITE_SUPABASE_URL` from **Project Settings → API** character-for-character (`https://<ref>.supabase.co`).
3. **Isolation**: open `https://<ref>.supabase.co/rest/v1/` in a new tab; if it fails, fix connectivity first.
4. **Extensions / browser**: try incognito; disable blockers that block third-party requests.
5. **VPN / firewall / proxy**: ensure `*.supabase.co` is allowed.
6. **Env + Vite**: after changing `.env`, **restart** `npm run dev`.
7. **Dashboard**: confirm the project is **not paused**.

If you get a **JSON** error with a code/message instead, follow the on-page hints for SQL, keys, and `landing_content`.

## Deploy

**Hosting choice: Vercel** (static Vite build + env vars in the project dashboard).

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_PUBLIC_SLUG` to match production.

Netlify or Cloudflare Pages work the same way with the same env vars.

## Security notes

- Admin checks use **database RPCs**; the password hash is not readable via RLS.
- The app keeps the password in **sessionStorage** after sign-in so refresh keeps you signed in; treat the device as trusted.
- Brute-force protection is **not** in MVP; add rate limits or move to Supabase Auth later if the URL is public.

## Docs

Product and UX source of truth live under `docs/` (PRD, architecture, design system, wireframes, test plan).
