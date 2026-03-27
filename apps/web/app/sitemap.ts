import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

/**
 * API base URL for server-side sitemap fetches. Must be set so the Next server can reach the API.
 * Uses NEXT_PUBLIC_API_URL (same as client); fallback for local dev.
 */
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return url.replace(/\/$/, "");
}

/**
 * Static description pages: indexable content that does not rely on the custom API.
 * Add new description pages here so they appear in the sitemap.
 */
const STATIC_DESCRIPTION_PAGES: {
  path: string;
  changeFrequency: "yearly" | "monthly" | "weekly" | "daily";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/democratie", changeFrequency: "monthly", priority: 0.8 },
  { path: "/democratie/comment-une-loi-est-votee", changeFrequency: "yearly", priority: 0.7 },
  { path: "/democratie/assemblee-nationale", changeFrequency: "yearly", priority: 0.7 },
  { path: "/democratie/senat", changeFrequency: "yearly", priority: 0.7 },
  { path: "/democratie/votre-role-citoyen", changeFrequency: "yearly", priority: 0.7 },
  { path: "/democratie/commissions", changeFrequency: "yearly", priority: 0.7 },
  { path: "/democratie/elections-municipales", changeFrequency: "yearly", priority: 0.7 },
  { path: "/municipales-2026", changeFrequency: "monthly", priority: 0.7 },
  // Redirect source — kept in sitemap to preserve inbound links during transition
  { path: "/elections-2026", changeFrequency: "yearly", priority: 0.4 },
  { path: "/sources", changeFrequency: "monthly", priority: 0.8 },
  { path: "/bills", changeFrequency: "daily", priority: 0.7 },
  { path: "/commissions", changeFrequency: "weekly", priority: 0.7 },
  { path: "/votes", changeFrequency: "daily", priority: 0.7 },
  { path: "/votes/upcoming", changeFrequency: "daily", priority: 0.7 },
  { path: "/groupes", changeFrequency: "weekly", priority: 0.7 },
  { path: "/mon-depute", changeFrequency: "weekly", priority: 0.8 },
  { path: "/circonscriptions", changeFrequency: "weekly", priority: 0.7 },
  { path: "/timeline", changeFrequency: "daily", priority: 0.7 },
  { path: "/search", changeFrequency: "weekly", priority: 0.6 }
];

const BILLS_PAGE_SIZE = 200;
const MAX_BILLS = 5000;
const MAX_SCRUTINS = 5000;
const MAX_SITTINGS = 3000;
const MAX_COMMISSIONS = 1000;
const SITEMAP_FETCH_TIMEOUT_MS = 15000;

function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal, next: { revalidate: 3600 } })
    .then((r) => {
      clearTimeout(timeout);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json() as Promise<T>;
    })
    .catch((err) => {
      clearTimeout(timeout);
      throw err;
    });
}

type BillsListResponse = {
  bills: Array<{ id: string; latest_scrutin_date?: string | null }>;
  has_more: boolean;
};

async function fetchBillIdsAndDates(
  apiBase: string
): Promise<Array<{ id: string; lastModified: Date }>> {
  const entries: Array<{ id: string; lastModified: Date }> = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore && entries.length < MAX_BILLS) {
    const res = await fetchJson<BillsListResponse>(
      `${apiBase}/bills?limit=${BILLS_PAGE_SIZE}&offset=${offset}`
    );
    for (const b of res.bills ?? []) {
      entries.push({
        id: b.id,
        lastModified: b.latest_scrutin_date
          ? new Date(b.latest_scrutin_date)
          : new Date()
      });
    }
    hasMore = res.has_more === true && (res.bills?.length ?? 0) === BILLS_PAGE_SIZE;
    offset += BILLS_PAGE_SIZE;
  }
  return entries;
}

type ScrutinsResponse = {
  scrutins: Array<{ id: string; date_scrutin: string }>;
};

function monthRange(monthsBack: number): { from: string; to: string }[] {
  const ranges: { from: string; to: string }[] = [];
  const now = new Date();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const from = `${y}-${m}-01`;
    const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
    const to = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    ranges.push({ from, to });
  }
  return ranges;
}

async function fetchScrutinIdsAndDates(
  apiBase: string
): Promise<Array<{ id: string; lastModified: Date }>> {
  const entries: Array<{ id: string; lastModified: Date }> = [];
  const seen = new Set<string>();
  const ranges = monthRange(24);
  for (const { from, to } of ranges) {
    if (entries.length >= MAX_SCRUTINS) break;
    try {
      const res = await fetchJson<ScrutinsResponse>(
        `${apiBase}/scrutins?from=${from}&to=${to}`
      );
      for (const s of res.scrutins ?? []) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        entries.push({
          id: s.id,
          lastModified: new Date(s.date_scrutin)
        });
        if (entries.length >= MAX_SCRUTINS) break;
      }
    } catch {
      // Skip this month on error (e.g. timeout or API down)
    }
  }
  return entries;
}

type AgendaRangeResponse = {
  agendas: Array<{
    sittings: Array<{ id: string }>;
  }>;
};

async function fetchSittingIds(
  apiBase: string
): Promise<Array<{ id: string; lastModified: Date }>> {
  const entries: Array<{ id: string; lastModified: Date }> = [];
  const seen = new Set<string>();
  const ranges = monthRange(24);
  const now = new Date();
  for (const { from, to } of ranges) {
    if (entries.length >= MAX_SITTINGS) break;
    try {
      const res = await fetchJson<AgendaRangeResponse>(
        `${apiBase}/agenda/range?from=${from}&to=${to}`
      );
      for (const agenda of res.agendas ?? []) {
        for (const sitting of agenda.sittings ?? []) {
          if (seen.has(sitting.id)) continue;
          seen.add(sitting.id);
          entries.push({
            id: sitting.id,
            lastModified: new Date(now)
          });
          if (entries.length >= MAX_SITTINGS) break;
        }
      }
    } catch {
      // Skip this month on error
    }
  }
  return entries;
}

type CommissionsTypesResponse = { types: Array<{ code: string }> };
type Organe = { id: string };

async function fetchCommissionIds(
  apiBase: string
): Promise<Array<{ id: string; lastModified: Date }>> {
  const entries: Array<{ id: string; lastModified: Date }> = [];
  const seen = new Set<string>();
  try {
    const typesRes = await fetchJson<CommissionsTypesResponse>(
      `${apiBase}/commissions/types`
    );
    const codes = (typesRes.types ?? []).map((t) => t.code).filter(Boolean);
    for (const code of codes) {
      if (entries.length >= MAX_COMMISSIONS) break;
      try {
        const list = await fetchJson<Organe[]>(
          `${apiBase}/commissions?type=${encodeURIComponent(code)}`
        );
        const listArr = Array.isArray(list) ? list : [];
        for (const o of listArr) {
          if (o?.id && !seen.has(o.id)) {
            seen.add(o.id);
            entries.push({ id: o.id, lastModified: new Date() });
            if (entries.length >= MAX_COMMISSIONS) break;
          }
        }
      } catch {
        // Skip this type on error
      }
    }
  } catch {
    // Types or commissions API unreachable
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const apiBase = getApiBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_DESCRIPTION_PAGES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority
    })
  );

  const dynamicEntries: MetadataRoute.Sitemap = [];

  // Bills (prioritized)
  try {
    const bills = await fetchBillIdsAndDates(apiBase);
    for (const { id, lastModified } of bills) {
      dynamicEntries.push({
        url: `${baseUrl}/bills/${encodeURIComponent(id)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8
      });
    }
  } catch (err) {
    console.warn("Sitemap: could not fetch bills:", err);
  }

  // Scrutins (votes)
  try {
    const scrutins = await fetchScrutinIdsAndDates(apiBase);
    for (const { id, lastModified } of scrutins) {
      dynamicEntries.push({
        url: `${baseUrl}/votes/${encodeURIComponent(id)}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7
      });
    }
  } catch (err) {
    console.warn("Sitemap: could not fetch scrutins:", err);
  }

  // Sittings
  try {
    const sittings = await fetchSittingIds(apiBase);
    for (const { id, lastModified } of sittings) {
      dynamicEntries.push({
        url: `${baseUrl}/sitting/${encodeURIComponent(id)}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6
      });
    }
  } catch (err) {
    console.warn("Sitemap: could not fetch sittings:", err);
  }

  // Commissions
  try {
    const commissions = await fetchCommissionIds(apiBase);
    for (const { id, lastModified } of commissions) {
      dynamicEntries.push({
        url: `${baseUrl}/commissions/${encodeURIComponent(id)}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6
      });
    }
  } catch (err) {
    console.warn("Sitemap: could not fetch commissions:", err);
  }

  return [...staticEntries, ...dynamicEntries];
}
