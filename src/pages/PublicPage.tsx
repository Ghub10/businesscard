import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  describeSupabaseError,
  fetchLandingBySlug,
  isSupabaseNetworkFailure,
  logInteractionEventRpc,
  logPageViewRpc,
} from "../lib/supabase";
import { getSupabaseDisplayHost, isSupabaseConfigured } from "../lib/env";
import { ConfigError } from "../components/ConfigError";
import { CardPreferenceBar, PreferenceTogglesFloating } from "../components/PreferenceToggles";
import { usePreferences } from "../context/PreferencesContext";

function MailIcon() {
  return <span className="shrink-0 text-xl leading-none" aria-hidden>✉️</span>;
}

function PhoneIcon() {
  return <span className="shrink-0 text-xl leading-none" aria-hidden>📞</span>;
}

function LinkedInIcon() {
  return <span className="shrink-0 text-3xl leading-none" aria-hidden>💼</span>;
}

function GitHubIcon() {
  return <span className="shrink-0 text-3xl leading-none" aria-hidden>💻</span>;
}

function WebsiteIcon() {
  return <span className="shrink-0 text-3xl leading-none" aria-hidden>🌐</span>;
}

function ShareIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>📥</span>;
}

function CalendarIcon() {
  return <span className="shrink-0 text-lg leading-none" aria-hidden>📅</span>;
}

function PublicBg({ children }: { children: ReactNode }) {
  return (
    <div className="page-public-bg flex min-h-dvh items-start justify-center px-4 py-10 pb-16">
      <div className="public-particles" aria-hidden />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}

function PublicCard({ children }: { children: ReactNode }) {
  return (
    <div className="card-glow w-full max-w-sm rounded-3xl bg-card p-7 shadow-2xl">
      {children}
    </div>
  );
}

const DISPLAY_NAME = "Alejandro Abonnanzieri";
const DISPLAY_TITLE = "Web Content Creator";
const DISPLAY_ORG = "Sirnetz";
const DISPLAY_LOCATION = "United States";
const LINKEDIN_PROFILE_URL =
  "https://www.linkedin.com/in/alejandro-abonnanzieri-929b84b3/";
const GITHUB_PROFILE_URL = "https://github.com/Ghub10";
const SIRNETZ_URL = "https://www.sirnetz.com/";
const TYPEWRITER_MS = 42;
const TILT_MAX_DEG = 11;

export function PublicPage() {
  const { slug = "" } = useParams();
  const [flipped, setFlipped] = useState(false);
  const { playUiTap } = usePreferences();
  const [nameTyped, setNameTyped] = useState("");
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardTiltRef = useRef<HTMLDivElement>(null);

  const handleCardTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = cardTiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const nx = (e.clientX - cx) / (r.width / 2);
    const ny = (e.clientY - cy) / (r.height / 2);
    setTilt({
      ry: Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, nx * TILT_MAX_DEG)),
      rx: Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, -ny * TILT_MAX_DEG)),
    });
  }, []);

  const handleCardTiltLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
  }, []);

  const configured = isSupabaseConfigured();
  const q = useQuery({
    queryKey: ["landing", slug],
    queryFn: () => fetchLandingBySlug(slug),
    enabled: configured && Boolean(slug),
    retry: false,
  });

  useEffect(() => {
    if (!configured || !slug || !q.data) return;
    const key = `bc26_pv_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void logPageViewRpc(slug);
  }, [configured, slug, q.data]);

  useEffect(() => {
    if (!q.isSuccess || !q.data) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setNameTyped(DISPLAY_NAME);
      return;
    }
    setNameTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setNameTyped(DISPLAY_NAME.slice(0, i));
      if (i >= DISPLAY_NAME.length) window.clearInterval(id);
    }, TYPEWRITER_MS);
    return () => window.clearInterval(id);
  }, [q.isSuccess, q.data]);

  if (!configured) return <ConfigError />;

  if (!slug) {
    return (
      <>
        <PreferenceTogglesFloating />
        <PublicBg>
          <p className="text-white/80 text-sm pt-4">
            Missing page slug in the URL. Open the shared link that ends in /p/your-slug.
          </p>
        </PublicBg>
      </>
    );
  }

  if (q.isPending) {
    return (
      <>
        <PreferenceTogglesFloating />
        <PublicBg>
          <p className="text-white/70 text-sm pt-4">Loading…</p>
        </PublicBg>
      </>
    );
  }

  if (q.isError) {
    const detail = describeSupabaseError(q.error);
    const networkFailed = isSupabaseNetworkFailure(q.error);
    const supabaseHost = import.meta.env.DEV ? getSupabaseDisplayHost() : null;
    return (
      <>
        <PreferenceTogglesFloating />
        <PublicBg>
        <PublicCard>
          <h1 className="text-ink text-lg font-semibold">Could not load this page</h1>
          {supabaseHost ? (
            <p className="text-ink/60 mt-2 rounded-lg bg-white/40 px-3 py-2 text-xs leading-relaxed">
              Dev: Supabase host <code className="font-mono">{supabaseHost}</code>
              {" — "}
              run <code className="font-mono">npm run check:supabase</code> if DNS or fetch fails.
            </p>
          ) : null}
          <p className="text-danger mt-3 text-sm leading-relaxed">{detail}</p>
          <ul className="text-ink/70 mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {networkFailed ? (
              <>
                <li>Open <strong>DevTools → Network</strong>, find the request to <code className="bg-white/50 rounded px-1">…supabase.co/rest/v1/…</code>.</li>
                <li>If the host does not resolve, copy a fresh <strong>Project URL</strong> from the dashboard (project deleted, paused, or wrong ref).</li>
                <li>Paste <code className="bg-white/50 rounded px-1">VITE_SUPABASE_URL</code> exactly from <strong>Project Settings → API</strong>.</li>
                <li>Try incognito or disable ad blockers. Restart <code className="bg-white/50 rounded px-1">npm run dev</code> after any <code className="bg-white/50 rounded px-1">.env</code> change.</li>
              </>
            ) : (
              <>
                <li>Confirm <code className="bg-white/50 rounded px-1">.env</code> has both keys. Restart dev server.</li>
                <li>Run the SQL migration in the Supabase SQL Editor.</li>
                <li>Table <code className="bg-white/50 rounded px-1">landing_content</code> must allow <strong>anon</strong> SELECT.</li>
              </>
            )}
          </ul>
          <button type="button"
            className="text-primary mt-6 min-h-12 rounded-xl text-sm font-medium underline-offset-2 hover:underline"
            onClick={() => void q.refetch()}>
            Try again
          </button>
        </PublicCard>
        </PublicBg>
      </>
    );
  }

  const row = q.data;
  if (!row) {
    return (
      <>
        <PreferenceTogglesFloating />
        <PublicBg>
        <PublicCard>
          <p className="text-ink/70 text-sm">This link is not set up yet.</p>
        </PublicCard>
        </PublicBg>
      </>
    );
  }

  const displayPhone = row.cta_phone || import.meta.env.VITE_CTA_PHONE || null;
  const displayEmailRaw = row.cta_email || import.meta.env.VITE_CTA_EMAIL || null;
  const displayEmail = displayEmailRaw?.trim() || null;
  const scheduleHref = displayEmail
    ? `mailto:${encodeURIComponent(displayEmail)}?subject=${encodeURIComponent("Meeting request")}`
    : SIRNETZ_URL;

  const handleShareContact = () => {
    playUiTap();
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${DISPLAY_NAME}`,
      `TITLE:${DISPLAY_TITLE}`,
      `ORG:${DISPLAY_ORG}`,
    ];
    if (displayEmail) lines.push(`EMAIL:${displayEmail}`);
    if (displayPhone) lines.push(`TEL:+1${displayPhone.replace(/\D/g, "")}`);
    lines.push(`URL:${SIRNETZ_URL}`, "END:VCARD");
    const blob = new Blob([lines.join("\n")], { type: "text/vcard" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "alejandro-abonnanzieri.vcf";
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <PublicBg>
      {/* Perspective wrapper — load animation is separate from flip transition */}
      <div className="card-perspective w-full max-w-sm">
        <div className="card-flip-enter card-glow">
          <div
            ref={cardTiltRef}
            className="card-tilt-wrap will-change-transform"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transformStyle: "preserve-3d",
              transition: "transform 0.12s ease-out",
            }}
            onMouseMove={handleCardTiltMove}
            onMouseLeave={handleCardTiltLeave}
          >
        <div className={`card-inner${flipped ? " is-flipped" : ""}`}
          style={{ minHeight: "420px" }}>

          {/* ── FRONT ── (no pointer events when flipped — hidden face still sat above tel: links in hit-testing) */}
          <div
            className={`card-face relative w-full rounded-3xl bg-card p-7 shadow-2xl ${flipped ? "pointer-events-none" : ""}`}
          >
            <div className="mb-5 px-2 pt-1 text-center">
              <h1
                className="text-ink min-h-[2.75rem] text-2xl font-bold tracking-tight md:min-h-0"
                aria-live="polite"
              >
                {nameTyped}
                {nameTyped.length < DISPLAY_NAME.length ? (
                  <span
                    className="typewriter-caret ml-0.5 inline-block h-[1.05em] w-[2px] animate-pulse rounded-sm bg-ink align-middle"
                    aria-hidden
                  />
                ) : null}
              </h1>
              <p className="fade-up delay-2 text-ink/70 mt-1 text-base font-semibold">
                {DISPLAY_TITLE}
              </p>
              <p className="fade-up delay-3 text-ink/55 mt-0.5 text-sm font-medium tracking-wide">
                {DISPLAY_ORG}
              </p>
              <div className="photo-zoom delay-4 relative mt-5 flex justify-center">
                <img
                  src="/avatar.png"
                  alt="Alejandro Abonnanzieri"
                  className="h-40 w-52 rounded-[50%] object-cover object-top shadow-lg ring-4 ring-white/60 transition-shadow duration-300 hover:shadow-[0_0_40px_12px_rgba(30,10,60,0.6),0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                />
                <CardPreferenceBar />
              </div>
              <div className="mx-auto mt-5 w-12 border-t border-ink/20" />
            </div>

            {(displayEmail || displayPhone) ? (
              <div className="fade-up delay-5 mt-2 flex flex-col gap-3">
                {displayEmail ? (
                  <a
                    href={`mailto:${encodeURIComponent(displayEmail)}`}
                    onClick={(e) => {
                      playUiTap();
                      void logInteractionEventRpc(slug, "mailto_click");
                      /* Same-window mailto avoids an extra blank tab some browsers open for mailto inside 3D/transformed UI */
                      if (e.button !== 0) return;
                      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
                      e.preventDefault();
                      window.location.assign(`mailto:${encodeURIComponent(displayEmail)}`);
                    }}
                    className="cta-glow group flex min-h-[52px] w-full items-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-ink hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-ink transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                      <MailIcon />
                    </span>
                    <span className="min-w-0 flex-1 break-all text-center text-sm font-medium">{displayEmail}</span>
                    <span className="h-9 w-9 shrink-0" aria-hidden />
                  </a>
                ) : null}
                {displayPhone ? (
                  <a href={`tel:+1${displayPhone.replace(/\D/g, "")}`}
                    onClick={() => {
                      playUiTap();
                      void logInteractionEventRpc(slug, "tel_click");
                    }}
                    className="cta-glow group flex min-h-[52px] w-full items-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-ink hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-ink transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                      <PhoneIcon />
                    </span>
                    <span className="min-w-0 flex-1 text-center text-sm font-medium">{displayPhone}</span>
                    <span className="h-9 w-9 shrink-0" aria-hidden />
                  </a>
                ) : null}
              </div>
            ) : null}

            {row.footer_note ? (
              <p className="text-ink/50 mt-8 text-center text-xs leading-relaxed">{row.footer_note}</p>
            ) : null}

            {/* Flip hint */}
            <button
              type="button"
              onClick={() => {
                playUiTap();
                void logInteractionEventRpc(slug, "card_flip_open");
                setFlipped(true);
              }}
              className="mt-6 flex w-full items-center justify-center gap-1.5 text-ink/50 text-sm font-medium italic hover:text-ink/80 transition-colors"
            >
              <span>Tap to flip →</span>
            </button>
          </div>

          {/* ── BACK ── */}
          <div
            className={`card-back-face flex w-full flex-col rounded-3xl bg-card p-7 shadow-2xl ${flipped ? "" : "pointer-events-none"}`}
          >
            <h2 className="text-ink text-center text-xl font-bold tracking-tight">Connect With Me</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={LINKEDIN_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open LinkedIn profile at ${LINKEDIN_PROFILE_URL}`}
                onClick={() => {
                  playUiTap();
                  void logInteractionEventRpc(slug, "linkedin_click");
                }}
                className="cta-glow group flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-5 text-ink hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <LinkedInIcon />
                <span className="text-sm font-semibold">LinkedIn</span>
              </a>

              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open GitHub profile at ${GITHUB_PROFILE_URL}`}
                onClick={() => playUiTap()}
                className="cta-glow group flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-5 text-ink hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <GitHubIcon />
                <span className="text-sm font-semibold">GitHub</span>
              </a>

              <a
                href={SIRNETZ_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Sirnetz website at sirnetz.com"
                onClick={() => {
                  playUiTap();
                  void logInteractionEventRpc(slug, "sirnetz_click");
                }}
                className="cta-glow group flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-5 text-ink hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <WebsiteIcon />
                <span className="text-sm font-semibold">Website</span>
              </a>
            </div>

            <div className="mx-auto mt-5 w-12 border-t border-ink/20" />
            <p className="text-ink/60 mt-3 text-center text-sm font-medium">{DISPLAY_LOCATION}</p>

            <button
              type="button"
              onClick={handleShareContact}
              className="cta-glow mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-ink font-semibold hover:bg-white/80 active:scale-95 active:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ShareIcon />
              <span>Share Contact</span>
            </button>

            <a
              href={scheduleHref}
              aria-label="Schedule a meeting"
              onClick={() => playUiTap()}
              className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
            >
              <CalendarIcon />
              <span>Schedule a Meeting</span>
            </a>

            {/* Flip back */}
            <button
              type="button"
              onClick={() => {
                playUiTap();
                void logInteractionEventRpc(slug, "card_flip_close");
                setFlipped(false);
              }}
              className="mt-5 flex items-center justify-center gap-1.5 text-ink/50 text-sm font-medium italic hover:text-ink/80 transition-colors"
            >
              <span>← Tap to flip back</span>
            </button>
          </div>

        </div>
          </div>
        </div>
      </div>
    </PublicBg>
  );
}
