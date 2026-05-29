import { getSupabaseDisplayHost, getSupabaseEnvIssue } from "../lib/env";
import { PreferenceTogglesFloating } from "./PreferenceToggles";

export function ConfigError() {
  const issue = getSupabaseEnvIssue();
  const host = import.meta.env.DEV ? getSupabaseDisplayHost() : null;

  if (issue === "placeholder") {
    return (
      <>
        <PreferenceTogglesFloating />
        <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-ink text-xl font-semibold">Replace template values in .env</h1>
        <p className="text-muted mt-2 text-base leading-relaxed">
          <code className="bg-bg rounded px-1">.env</code> still has placeholder text (for example{" "}
          <code className="bg-bg rounded px-1">YOUR_PROJECT</code> or{" "}
          <code className="bg-bg rounded px-1">your_anon_key</code>). The app cannot reach Supabase until you
          paste your real values.
        </p>
        <ol className="text-muted mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>
            Supabase dashboard → <strong>Project Settings → API</strong>.
          </li>
          <li>
            Copy <strong>Project URL</strong> into <code className="bg-bg rounded px-1">VITE_SUPABASE_URL</code>{" "}
            (should look like <code className="bg-bg rounded px-1">https://abcd…supabase.co</code>).
          </li>
          <li>
            Copy the <strong>anon public</strong> key into{" "}
            <code className="bg-bg rounded px-1">VITE_SUPABASE_ANON_KEY</code> (long string, usually starts with{" "}
            <code className="bg-bg rounded px-1">eyJ</code>).
          </li>
          <li>
            Save <code className="bg-bg rounded px-1">.env</code>, then <strong>restart</strong>{" "}
            <code className="bg-bg rounded px-1">npm run dev</code>.
          </li>
        </ol>
        </main>
      </>
    );
  }

  if (issue === "invalid_url") {
    return (
      <>
        <PreferenceTogglesFloating />
        <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-ink text-xl font-semibold">Invalid Supabase URL in .env</h1>
        <p className="text-muted mt-2 text-base leading-relaxed">
          <code className="bg-bg rounded px-1">VITE_SUPABASE_URL</code> must be exactly the{" "}
          <strong>Project URL</strong> from the dashboard:{" "}
          <code className="bg-bg rounded px-1">https://&lt;ref&gt;.supabase.co</code> with no trailing slash or path.
        </p>
        {host ? (
          <p className="text-muted/80 mt-4 text-xs">
            Dev: parsed host <code className="bg-bg rounded px-1">{host}</code>
          </p>
        ) : null}
        <p className="text-muted mt-4 text-sm">
          Terminal: <code className="bg-bg rounded px-1">npm run check:supabase</code>
        </p>
        </main>
      </>
    );
  }

  if (issue === "invalid_key") {
    return (
      <>
        <PreferenceTogglesFloating />
        <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-ink text-xl font-semibold">Invalid anon key in .env</h1>
        <p className="text-muted mt-2 text-base leading-relaxed">
          <code className="bg-bg rounded px-1">VITE_SUPABASE_ANON_KEY</code> should be the{" "}
          <strong>anon public</strong> JWT from Project Settings → API (starts with{" "}
          <code className="bg-bg rounded px-1">eyJ</code>). Do not use <code className="bg-bg rounded px-1">service_role</code>.
        </p>
        </main>
      </>
    );
  }

  return (
    <>
      <PreferenceTogglesFloating />
      <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-ink text-xl font-semibold">Configuration needed</h1>
      <p className="text-muted mt-2 text-base leading-relaxed">
        Add <code className="bg-bg rounded px-1">VITE_SUPABASE_URL</code> and{" "}
        <code className="bg-bg rounded px-1">VITE_SUPABASE_ANON_KEY</code> to{" "}
        <code className="bg-bg rounded px-1">.env</code>. See README.
      </p>
      </main>
    </>
  );
}
