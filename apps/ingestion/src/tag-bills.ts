/**
 * Tag bills with thematic tags based on keyword matching.
 * Supports both single-bill tagging and fast batch mode.
 */

import { supabase } from "./supabase";
import { getTagKeywords } from "./tag-keywords";

type ThematicTag = {
  id: string;
  slug: string;
};

type BillTagRow = {
  bill_id: string;
  tag_id: string;
  source: string;
  confidence: number;
};

// Simple in-memory cache to avoid re-fetching all tags for every bill.
let cachedTags: ThematicTag[] | null = null;
let cachedTagsFetchedAt: number | null = null;
const TAG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Pre-computed normalised keywords per tag (lazy-init)
let keywordCache: Map<string, string[]> | null = null;

export async function getThematicTags(): Promise<ThematicTag[] | null> {
  const now = Date.now();
  if (
    cachedTags &&
    cachedTagsFetchedAt &&
    now - cachedTagsFetchedAt < TAG_CACHE_TTL_MS
  ) {
    return cachedTags;
  }

  const { data: tags, error: tagsError } = await supabase
    .from("thematic_tags")
    .select("id, slug");

  if (tagsError) {
    console.error("Error fetching thematic tags:", tagsError);
    return null;
  }

  if (!tags || tags.length === 0) {
    console.warn("No thematic tags found in database. Run migration first.");
    return null;
  }

  cachedTags = tags as ThematicTag[];
  cachedTagsFetchedAt = now;
  keywordCache = null; // reset derived cache
  return cachedTags;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getNormalisedKeywords(slug: string): string[] {
  if (!keywordCache) keywordCache = new Map();
  let cached = keywordCache.get(slug);
  if (!cached) {
    cached = getTagKeywords(slug).map(normalise);
    keywordCache.set(slug, cached);
  }
  return cached;
}

/**
 * Pure in-memory: compute tag rows for a single bill (no DB writes).
 */
export function matchBillTags(
  billId: string,
  title: string,
  shortTitle: string | null | undefined,
  tags: ThematicTag[],
): BillTagRow[] {
  const textToAnalyze = normalise([title, shortTitle].filter(Boolean).join(" "));

  const rows: BillTagRow[] = [];

  for (const tag of tags) {
    const keywords = getNormalisedKeywords(tag.slug);
    const matches = keywords.filter((kw) => textToAnalyze.includes(kw));

    if (matches.length > 0) {
      const weightedMatches = matches.reduce((sum, kw) => {
        const weight = kw.length > 10 ? 1.5 : kw.length > 5 ? 1.2 : 1.0;
        return sum + weight;
      }, 0);
      const confidence = Math.min(0.5 + weightedMatches * 0.1, 1.0);

      rows.push({
        bill_id: billId,
        tag_id: tag.id,
        source: "auto",
        confidence: Math.round(confidence * 100) / 100,
      });
    }
  }

  return rows;
}

/**
 * Tag a single bill (fetches tags, matches, writes to DB).
 * Good for tagging one bill at a time (e.g. during ingestion).
 */
export async function tagBill(
  billId: string,
  title: string,
  shortTitle?: string | null,
): Promise<void> {
  const tags = await getThematicTags();
  if (!tags || tags.length === 0) return;

  const rows = matchBillTags(billId, title, shortTitle, tags);
  if (rows.length === 0) return;

  await supabase.from("bill_thematic_tags").delete().eq("bill_id", billId);

  const { error } = await supabase.from("bill_thematic_tags").insert(rows);
  if (error) {
    console.error(`Error inserting tags for bill ${billId}:`, error);
  }
}

// ────────────────────────────────────────────────
// Batch helpers (used by tag-all-bills-cli)
// ────────────────────────────────────────────────

const UPSERT_CHUNK = 500; // rows per Supabase upsert call
const DELETE_CHUNK = 500; // bill IDs per delete call

/**
 * Batch-delete existing bill_thematic_tags for a set of bill IDs.
 */
export async function batchDeleteBillTags(billIds: string[]): Promise<void> {
  for (let i = 0; i < billIds.length; i += DELETE_CHUNK) {
    const chunk = billIds.slice(i, i + DELETE_CHUNK);
    const { error } = await supabase
      .from("bill_thematic_tags")
      .delete()
      .in("bill_id", chunk);
    if (error) {
      console.error(`Error batch-deleting tags (offset ${i}):`, error);
    }
  }
}

/**
 * Batch-upsert tag rows. Uses ON CONFLICT (bill_id, tag_id) DO UPDATE
 * so it's safe to re-run.
 */
export async function batchUpsertBillTags(rows: BillTagRow[]): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from("bill_thematic_tags")
      .upsert(chunk, { onConflict: "bill_id,tag_id" });
    if (error) {
      console.error(`Error upserting tags (offset ${i}):`, error);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, errors };
}

/**
 * Remove all tags for a bill (useful for re-tagging)
 */
export async function removeBillTags(billId: string): Promise<void> {
  await supabase
    .from("bill_thematic_tags")
    .delete()
    .eq("bill_id", billId);
}
