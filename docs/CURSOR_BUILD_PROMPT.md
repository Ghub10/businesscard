# Cursor build prompt

## Role

You are a **senior mobile web engineer** implementing **MVP only** per:

- [PRD.md](./PRD.md)
- [FEATURE_PRIORITY.md](./FEATURE_PRIORITY.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [UI_WIREFRAMES.md](./UI_WIREFRAMES.md)

Validate against [TEST_PLAN.md](./TEST_PLAN.md).

## Goal

Build a **QR-first client landing page**: clients **read** + complete **one primary action**; **no client login**. Owner edits behind **password**. Show **simple totals** (visits + completions). Prioritize **fast mobile load** when online.

## Stack (baseline)

- **Vite + React + TypeScript + Tailwind + React Router**
- **Supabase** *(recommended)* for content + events + auth/password pattern **or** equivalent backend
- Deploy: **Vercel / Netlify / Cloudflare Pages** (document choice in README)

## Implementation notes

- Pick **one** concrete primary-action pattern for MVP (for example: **submit minimal form** *or* **deep-link to external booking**). Document the choice in README; do not implement three patterns.
- Provide SQL migration or Supabase setup steps for tables and RLS.
- `page_view` on public load; `primary_action_complete` on successful action.

## Build order

1. Scaffold Vite/React/TS/Tailwind/router.
2. Theme tokens per design system.
3. Public page + success state.
4. Admin password gate + editor.
5. Persistence + publish path.
6. Event logging + stats screen.
7. QR + copy link screen.
8. Perf + a11y pass; run test plan.

## Rules

- Small commits/messages, small files, beginner-readable code.
- **No feature creep** beyond MVP.
- `npm install` + `npm run dev` must work with documented env vars.

## Definition of done

- [ ] QR URL shows correct live content after edits.
- [ ] Password protects admin.
- [ ] Stats reflect test traffic at coarse level.
- [ ] Mobile usability and test plan core cases pass.

## Non-goals

No native apps; no Phase 2 features unless asked.
