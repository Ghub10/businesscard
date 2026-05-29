import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminNav } from "../components/AdminNav";
import { Button } from "../components/Button";
import { ConfigError } from "../components/ConfigError";
import { useAdminPassword, useAdminLogout } from "../hooks/useAdminSession";
import { adminFetchStats } from "../lib/adminApi";
import { isSupabaseConfigured } from "../lib/env";
import { PUBLIC_SLUG } from "../lib/publicSlug";

const windows = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
] as const;

function fmt(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function AdminStats() {
  const pw = useAdminPassword();
  const logout = useAdminLogout();
  const [days, setDays] = useState<number>(7);

  const q = useQuery({
    queryKey: ["admin-stats", PUBLIC_SLUG, pw, days],
    queryFn: async () => {
      if (!pw) throw new Error("no session");
      return adminFetchStats(pw, PUBLIC_SLUG, days);
    },
    enabled: Boolean(pw) && isSupabaseConfigured(),
  });

  useEffect(() => {
    if (!q.error) return;
    const m = String((q.error as Error).message);
    if (m.includes("unauthorized") || m.includes("P0401")) logout();
  }, [q.error, logout]);

  if (!isSupabaseConfigured()) return <ConfigError />;

  const stats = q.data;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-16">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-ink text-lg font-semibold">Stats</h1>
        <Button type="button" variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>

      <AdminNav />

      <section className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm" aria-labelledby="stats-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="stats-heading" className="text-ink text-base font-semibold">
            Totals
          </h2>
          <label className="text-muted sr-only" htmlFor="window">
            Time window
          </label>
          <select
            id="window"
            className="border-line text-ink min-h-12 rounded-xl border-2 bg-surface px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {windows.map((w) => (
              <option key={w.days} value={w.days}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {q.isPending ? (
          <p className="text-muted mt-6 text-sm">Loading…</p>
        ) : q.isError ? (
          <p className="text-danger mt-6 text-sm">Could not load stats.</p>
        ) : stats ? (
          <div className="mt-6 space-y-8">
            <dl className="space-y-4">
              <div className="flex justify-between gap-4 text-base">
                <dt className="text-muted">Visits</dt>
                <dd className="text-ink font-semibold tabular-nums">{fmt(stats.visits)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base">
                <dt className="text-muted">Completions</dt>
                <dd className="text-ink font-semibold tabular-nums">{fmt(stats.completions)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base">
                <dt className="text-muted">Conversion</dt>
                <dd className="text-ink font-semibold tabular-nums">{stats.conversion_pct}%</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-ink text-sm font-semibold tracking-wide">Interactions</h3>
              <p className="text-muted mt-1 text-xs leading-relaxed">
                CTA and card actions in the selected window (same period as totals above).
              </p>
              <dl className="mt-4 space-y-3 border-t border-line pt-4">
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">Phone (tel)</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.tel_clicks)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">Email (mailto)</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.mailto_clicks)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">Sirnetz</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.sirnetz_clicks)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">LinkedIn</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.linkedin_clicks)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">Card flip open</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.card_flip_opens)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">Card flip close</dt>
                  <dd className="text-ink font-semibold tabular-nums">{fmt(stats.card_flip_closes)}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </section>

      <p className="text-muted mt-8 text-center text-sm">
        <Link to="/admin/edit" className="text-primary underline-offset-2 hover:underline">
          Back to edit
        </Link>
      </p>
    </div>
  );
}
