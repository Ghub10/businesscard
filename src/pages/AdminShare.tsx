import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminNav } from "../components/AdminNav";
import { Button } from "../components/Button";
import { ConfigError } from "../components/ConfigError";
import { useAdminLogout } from "../hooks/useAdminSession";
import { isSupabaseConfigured } from "../lib/env";
import { absolutePublicUrl, publicPagePath, PUBLIC_SLUG } from "../lib/publicSlug";

export function AdminShare() {
  const logout = useAdminLogout();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const url = absolutePublicUrl(PUBLIC_SLUG);
  const path = publicPagePath(PUBLIC_SLUG);

  useEffect(() => {
    if (!url) return;
    let cancel = false;
    void import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: { dark: "#111111", light: "#FFFFFF" },
        })
      )
      .then((s) => {
        if (!cancel) setDataUrl(s);
      })
      .catch(() => {
        if (!cancel) setQrError("Could not create QR code.");
      });
    return () => {
      cancel = true;
    };
  }, [url]);

  if (!isSupabaseConfigured()) return <ConfigError />;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-16">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-ink text-lg font-semibold">Share</h1>
        <Button type="button" variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>
      <AdminNav />

      <section className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm" aria-labelledby="share-heading">
        <h2 id="share-heading" className="text-ink text-base font-semibold">
          Public link
        </h2>
        <p className="text-muted mt-2 break-all text-sm leading-relaxed">{url || path}</p>
        <Button
          type="button"
          className="mt-4"
          variant="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url || `${window.location.origin}${path}`);
            } catch {
              setQrError("Copy failed. Select the link and copy manually.");
            }
          }}
        >
          Copy link
        </Button>

        <div className="mt-8 flex flex-col items-center gap-3">
          {dataUrl ? (
            <>
              <img src={dataUrl} width={280} height={280} className="rounded-xl bg-white p-2" alt="QR code for public page" />
              <a
                href={dataUrl}
                download={`qr-${PUBLIC_SLUG}.png`}
                className="text-primary text-sm font-medium underline-offset-2 hover:underline"
              >
                Download QR (PNG)
              </a>
            </>
          ) : qrError ? (
            <p className="text-danger text-sm">{qrError}</p>
          ) : (
            <p className="text-muted text-sm">Generating QR…</p>
          )}
        </div>
      </section>

      <p className="text-muted mt-8 text-center text-sm">
        <Link to="/admin/edit" className="text-primary underline-offset-2 hover:underline">
          Back to edit
        </Link>
      </p>
    </div>
  );
}
