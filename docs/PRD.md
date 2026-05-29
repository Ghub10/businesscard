# Product Requirements Document (PRD)

## 1. Product overview

A **mobile-first web app** you show **clients in person** (main entry: **QR code**). It does **one simple job**: clients **read** what you put in front of them, then take **one clear action** (for example: submit a short request, confirm something, tap through to book, or complete a single step you define in build). **Clients never sign in.** You can **edit** the content behind a **password**. The app **tracks simple totals** for you (such as how many visits or how many times the main action was completed).

## 2. Problem statement

In-person client moments are short; you need a **fast, trustworthy page** that explains what you want them to do **once**, without account friction. You also need **lightweight visibility** into usage—enough to see traction, not a full analytics suite.

## 3. Target users

- **Owner / operator (you):** serves **customers or clients**; updates messaging and monitors basic counts.
- **Clients:** phone in hand after **scanning a QR**; expect clarity and speed.

## 4. Assumptions

- **One** primary client-facing flow for **everyone** (no per-client customized journeys in MVP).
- **No** client authentication in MVP.
- **Internet available** for a good experience; **fast online load** is the priority over offline-first first visits.
- Exact “one action” (book vs form vs external link) will be implemented as **one primary CTA** configured during setup; MVP supports **one** such pattern.

## 5. Core user flows

### Client

1. Scan **QR** → land on **public page**.
2. **Read** owner content (headline, short supporting text, optional highlights).
3. Complete **primary action** (single-step or minimal steps).
4. See a clear **success / next step** state.

### Owner

1. Open **admin** URL, enter **password**.
2. Edit **copy**, **primary action** settings (within the chosen MVP pattern), and any **simple fields** the build defines.
3. View **totals**: visits and completions (definitions aligned with implementation).
4. Copy **public link** and **QR** source for printing/screens.

## 6. Screen requirements

- **Public client page** (mobile-first; large tap targets).
- **Admin: sign-in** (password).
- **Admin: content & CTA** editor.
- **Admin: simple stats** (totals + basic time window if feasible).
- **Error states** (wrong password, load failure).

## 7. Data model (conceptual)

- **Owner account marker** (implementation-specific): ties edits to you.
- **Published content snapshot** or versioned fields: headline, subcopy, CTA configuration, optional list blocks.
- **Events:** `page_view`, `primary_action_complete` (or equivalent) with timestamp; **no** PII required from clients in MVP unless the primary action explicitly collects it (if so, treat as sensitive and disclose).

## 8. Functional requirements

### MVP

- Public page served at a stable URL suitable for QR encoding.
- Password-gated admin; cross-device usable.
- Edit publishable content; changes reflect on public page.
- Track and display **simple totals** (aggregates).
- Performance: prioritize **fast first load** on mobile.

### Phase 2

- Optional richer analytics (funnels, referrer, export).
- Draft vs publish; scheduling.
- Optional returning-client continuity (still minimizing friction).

### Phase 3 / future

- Multiple experiences/variants; multi-location; team roles; integrations (CRM, payments).

## 9. Non-goals

- **Native** mobile apps.
- Full website builder.
- Heavy per-user dashboards for clients.

## 10. Edge cases

- Client declines permissions needed for the action (e.g. file upload)—show guidance.
- Duplicate taps / double submits—MVP may use idempotency hints or simple UI guards.
- Owner forgets password—recovery path (Phase 2 unless email-based MVP is chosen during build).

## 11. Success metrics

- Median **LCP** within an agreed target on mid-tier mobile on good connection.
- ≥ X% of QR scans reach **successful primary action** in testing (set X during QA).
- Owner can publish a change in under N minutes without support (set N during QA).

## 12. Future roadmap

See [FEATURE_PRIORITY.md](./FEATURE_PRIORITY.md).
