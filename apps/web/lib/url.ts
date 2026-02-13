/**
 * Base URL for the web app (server-side only). Used for sitemap, metadata, and share links.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://agora.example.com).
 * For client-side canonical URL use window.location.origin or pass url into ShareBar.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://agora.example.com";
}
