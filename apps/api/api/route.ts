/**
 * Single catch-all API route.
 * All /api/* requests are rewritten here (see vercel.json). Dispatches by path + method.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

function getPathFromUrl(req: VercelRequest): string {
  // Vercel rewrite /api/:path* -> /api/route adds path as query param (path=agenda)
  const q = req.query?.path;
  if (typeof q === "string" && q) return q;
  if (Array.isArray(q) && q.length > 0 && typeof q[0] === "string") return q[0];

  const url = req.url || "";
  const pathname = url.startsWith("http")
    ? new URL(url).pathname
    : url.split("?")[0];
  const base = "/api";
  if (pathname === base || pathname === `${base}/`) return "";
  if (pathname.startsWith(`${base}/`)) {
    const afterApi = pathname.slice(base.length + 1);
    if (afterApi.startsWith("route/")) return afterApi.slice(6);
    if (afterApi === "route") return "";
    return afterApi;
  }
  if (pathname.startsWith("/")) return pathname.slice(1);
  return pathname;
}

/** Inject path params; Express req.query is getter-only so use a custom property */
function withParams(req: VercelRequest, params: Record<string, string>): void {
  const r = req as VercelRequest & { pathParams?: Record<string, string> };
  r.pathParams = { ...r.pathParams, ...params };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const path = getPathFromUrl(req);
  const segments = path ? path.split("/") : [];
  const method = req.method || "GET";

  // Lazy-load handlers to keep cold start smaller and avoid circular deps
  let routeHandler: Handler | null = null;
  let matched = false;

  // Exact path + method
  if (path === "agenda" && method === "GET") {
    const m = await import("../lib/handlers/agenda");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "agenda/range" && method === "GET") {
    const m = await import("../lib/handlers/agenda-range");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "search" && method === "GET") {
    const m = await import("../lib/handlers/search");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "ingestion-status" && method === "GET") {
    const m = await import("../lib/handlers/ingestion-status");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "departements" && method === "GET") {
    const m = await import("../lib/handlers/departements");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "deputies" && method === "GET") {
    const m = await import("../lib/handlers/deputies");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "groups" && method === "GET") {
    const m = await import("../lib/handlers/groups");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "scrutins" && method === "GET") {
    const m = await import("../lib/handlers/scrutins");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "circonscriptions" && method === "GET") {
    const m = await import("../lib/handlers/circonscriptions");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "circonscriptions/geojson" && method === "GET") {
    const m = await import("../lib/handlers/circonscriptions-geojson");
    routeHandler = m.default;
    matched = true;
  }
  if (path === "push/register" && (method === "POST" || method === "DELETE")) {
    const m = await import("../lib/handlers/push-register");
    routeHandler = m.default;
    matched = true;
  }
  if (
    path === "cron/notify-scrutins" &&
    (method === "GET" || method === "POST")
  ) {
    const m = await import("../lib/handlers/cron-notify-scrutins");
    routeHandler = m.default;
    matched = true;
  }

  // Dynamic: sittings/:id (require non-empty id)
  if (
    !matched &&
    segments[0] === "sittings" &&
    segments.length === 2 &&
    segments[1] &&
    method === "GET"
  ) {
    withParams(req, { id: segments[1] });
    const m = await import("../lib/handlers/sittings");
    routeHandler = m.default;
    matched = true;
  }
  // Dynamic: scrutins/:id
  if (
    !matched &&
    segments[0] === "scrutins" &&
    segments.length === 2 &&
    method === "GET"
  ) {
    withParams(req, { id: segments[1] });
    const m = await import("../lib/handlers/scrutins-id");
    routeHandler = m.default;
    matched = true;
  }
  // Dynamic: deputy/:acteurRef
  if (
    !matched &&
    segments[0] === "deputy" &&
    segments.length === 2 &&
    method === "GET"
  ) {
    withParams(req, { acteurRef: segments[1] });
    const m = await import("../lib/handlers/deputy");
    routeHandler = m.default;
    matched = true;
  }
  // Dynamic: deputies/:acteurRef/votes
  if (
    !matched &&
    segments[0] === "deputies" &&
    segments.length === 3 &&
    segments[2] === "votes" &&
    method === "GET"
  ) {
    withParams(req, { acteurRef: segments[1] });
    const m = await import("../lib/handlers/deputies-votes");
    routeHandler = m.default;
    matched = true;
  }
  // Dynamic: groups/:slug
  if (
    !matched &&
    segments[0] === "groups" &&
    segments.length === 2 &&
    method === "GET"
  ) {
    withParams(req, { slug: segments[1] });
    const m = await import("../lib/handlers/groups-slug");
    routeHandler = m.default;
    matched = true;
  }
  // Dynamic: circonscriptions/:id (exclude geojson)
  if (
    !matched &&
    segments[0] === "circonscriptions" &&
    segments.length === 2 &&
    segments[1] !== "geojson" &&
    method === "GET"
  ) {
    withParams(req, { id: segments[1] });
    const m = await import("../lib/handlers/circonscriptions-id");
    routeHandler = m.default;
    matched = true;
  }

  if (!matched || !routeHandler) {
    res.status(404).json({
      error: "NotFound",
      message: `No route for ${method} /api/${path || ""}`,
    });
    return;
  }

  try {
    await routeHandler(req, res);
  } catch (err) {
    console.error("Route handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "InternalError",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}
