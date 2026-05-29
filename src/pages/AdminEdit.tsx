import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AdminNav } from "../components/AdminNav";
import { Button } from "../components/Button";
import { ConfigError } from "../components/ConfigError";
import { TextArea } from "../components/TextArea";
import { TextField } from "../components/TextField";
import { useAdminLogout, useAdminPassword } from "../hooks/useAdminSession";
import { adminFetchContent, adminSaveContent, type SaveLandingInput } from "../lib/adminApi";
import { isSupabaseConfigured } from "../lib/env";
import { PUBLIC_SLUG } from "../lib/publicSlug";

function bulletsToText(bullets: string[]): string {
  return bullets.join("\n");
}

function textToBullets(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function AdminEdit() {
  const pw = useAdminPassword();
  const logout = useAdminLogout();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SaveLandingInput | null>(null);
  const [bulletsText, setBulletsText] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-landing", PUBLIC_SLUG, pw],
    queryFn: async () => {
      if (!pw) throw new Error("no session");
      return adminFetchContent(pw, PUBLIC_SLUG);
    },
    enabled: Boolean(pw) && isSupabaseConfigured(),
  });

  useEffect(() => {
    if (!q.error) return;
    const m = String((q.error as Error).message);
    if (m.includes("unauthorized") || m.includes("P0401")) {
      logout();
      navigate("/admin", { replace: true });
    }
  }, [q.error, logout, navigate]);

  useEffect(() => {
    const row = q.data;
    if (!row || draft) return;
    setDraft({
      headline: row.headline,
      supporting_text: row.supporting_text,
      bullets: row.bullets,
      primary_button_label: row.primary_button_label,
      success_headline: row.success_headline,
      success_message: row.success_message,
      footer_note: row.footer_note ?? "",
      form_name_required: row.form_name_required,
      form_email_show: row.form_email_show,
      form_email_required: row.form_email_required,
      cta_phone: row.cta_phone ?? null,
      cta_email: row.cta_email ?? null,
    });
    setBulletsText(bulletsToText(row.bullets));
  }, [q.data, draft]);

  const save = useMutation({
    mutationFn: async () => {
      if (!pw || !draft) throw new Error("missing");
      const payload: SaveLandingInput = {
        ...draft,
        bullets: textToBullets(bulletsText),
      };
      await adminSaveContent(pw, PUBLIC_SLUG, payload);
    },
    onSuccess: () => {
      setSaveError(null);
      setSavedAt(new Date().toLocaleTimeString());
      void qc.invalidateQueries({ queryKey: ["landing", PUBLIC_SLUG] });
      void qc.invalidateQueries({ queryKey: ["admin-landing", PUBLIC_SLUG] });
    },
    onError: (e) => {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "";
      if (msg.includes("unauthorized") || msg.includes("P0401")) {
        setSaveError("Session expired. Sign in again.");
        logout();
        navigate("/admin", { replace: true });
        return;
      }
      setSaveError("Save failed. Try again.");
    },
  });

  if (!isSupabaseConfigured()) return <ConfigError />;

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-muted text-sm">Loading editor…</p>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-danger text-sm">Could not load content.</p>
        <Button className="mt-4" variant="secondary" onClick={() => void q.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-muted text-sm">
          No published page for slug <code className="bg-bg rounded px-1">{PUBLIC_SLUG}</code>. Run the
          database migration seed or add a row.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-16">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-ink text-lg font-semibold">Edit content</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>
      {savedAt ? (
        <p className="text-muted mb-4 text-sm" role="status">
          Saved at {savedAt}
        </p>
      ) : null}
      {saveError ? (
        <p className="text-danger mb-4 text-sm" role="alert">
          {saveError}
        </p>
      ) : null}

      <AdminNav />

      <div className="mt-6 flex flex-col gap-5">
        <TextField
          label="Headline"
          value={draft.headline}
          onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
        />
        <TextArea
          label="Supporting text"
          value={draft.supporting_text}
          onChange={(e) => setDraft({ ...draft, supporting_text: e.target.value })}
        />
        <TextArea
          label="Bullets (one per line)"
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
        />
        <TextField
          label="Primary button label"
          value={draft.primary_button_label}
          onChange={(e) => setDraft({ ...draft, primary_button_label: e.target.value })}
        />

        <fieldset className="border-line flex flex-col gap-3 rounded-xl border p-4">
          <legend className="text-ink px-1 text-sm font-medium">Form (minimal)</legend>
          <p className="text-muted text-xs leading-relaxed">
            MVP pattern: one short form, then success. Submissions are counted; name/email are not
            stored.
          </p>
          <label className="text-muted flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.form_name_required}
              onChange={(e) => setDraft({ ...draft, form_name_required: e.target.checked })}
              className="h-5 w-5 rounded border-2"
            />
            Require name
          </label>
          <label className="text-muted flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.form_email_show}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  form_email_show: e.target.checked,
                  form_email_required: e.target.checked ? draft.form_email_required : false,
                })
              }
              className="h-5 w-5 rounded border-2"
            />
            Ask for email
          </label>
          {draft.form_email_show ? (
            <label className="text-muted flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.form_email_required}
                onChange={(e) => setDraft({ ...draft, form_email_required: e.target.checked })}
                className="h-5 w-5 rounded border-2"
              />
              Email required
            </label>
          ) : null}
        </fieldset>

        <TextField
          label="Success headline"
          value={draft.success_headline}
          onChange={(e) => setDraft({ ...draft, success_headline: e.target.value })}
        />
        <TextArea
          label="Success message"
          value={draft.success_message}
          onChange={(e) => setDraft({ ...draft, success_message: e.target.value })}
        />
        <TextField
          label="Footer note (optional)"
          value={draft.footer_note ?? ""}
          onChange={(e) => setDraft({ ...draft, footer_note: e.target.value })}
        />

        <fieldset className="border-line flex flex-col gap-3 rounded-xl border p-4">
          <legend className="text-ink px-1 text-sm font-medium">Contact CTA buttons</legend>
          <p className="text-muted text-xs leading-relaxed">
            Shown on the public page as tappable links. Leave blank to hide.
          </p>
          <TextField
            label="Phone number (optional)"
            value={draft.cta_phone ?? ""}
            onChange={(e) => setDraft({ ...draft, cta_phone: e.target.value || null })}
            placeholder="+1 (385) 515-2421"
            type="tel"
          />
          <TextField
            label="Email address (optional)"
            value={draft.cta_email ?? ""}
            onChange={(e) => setDraft({ ...draft, cta_email: e.target.value || null })}
            placeholder="you@example.com"
            type="email"
          />
        </fieldset>
      </div>

      <p className="text-muted mt-10 text-center text-sm">
        <Link to="/admin/share" className="text-primary font-medium underline-offset-2 hover:underline">
          Share / QR
        </Link>
        {" · "}
        <Link to="/admin/stats" className="text-primary font-medium underline-offset-2 hover:underline">
          Stats
        </Link>
      </p>
    </div>
  );
}
