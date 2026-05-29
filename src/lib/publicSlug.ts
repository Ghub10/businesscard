/** Slug in URL /p/:slug — must match a row in landing_content. */
export const PUBLIC_SLUG = import.meta.env.VITE_PUBLIC_SLUG ?? "default";

export function publicPagePath(slug: string = PUBLIC_SLUG): string {
  return `/p/${encodeURIComponent(slug)}`;
}

export function absolutePublicUrl(slug: string = PUBLIC_SLUG): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${publicPagePath(slug)}`;
}
