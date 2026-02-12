/**
 * Tag scrutins with thematic tags based on keyword matching.
 * Supports both single-scrutin tagging and fast batch mode.
 */

import { supabase } from "./supabase";
import { getTagKeywords } from "./tag-keywords";

type ThematicTag = {
  id: string;
  slug: string;
};

type ScrutinTagRow = {
  scrutin_id: string;
  tag_id: string;
  source: string;
  confidence: number;
};

// Simple in-memory cache to avoid re-fetching all tags for every scrutin.
let cachedTags: ThematicTag[] | null = null;
let cachedTagsFetchedAt: number | null = null;
const TAG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Pre-computed normalised keywords per tag (lazy-init)
let keywordCache: Map<string, string[]> | null = null;

export async function getScrutinThematicTags(): Promise<ThematicTag[] | null> {
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
 * Pure in-memory: compute tag rows for a single scrutin (no DB writes).
 */
export function matchScrutinTags(
  scrutinId: string,
  titre: string,
  objetLibelle: string | null | undefined,
  tags: ThematicTag[]
): ScrutinTagRow[] {
  const textToAnalyze = normalise(
    [titre, objetLibelle].filter(Boolean).join(" ")
  );

  const rows: ScrutinTagRow[] = [];

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
        scrutin_id: scrutinId,
        tag_id: tag.id,
        source: "auto",
        confidence: Math.round(confidence * 100) / 100
      });
    }
  }

  return rows;
}

/**
 * Tag a single scrutin (fetches tags, matches, writes to DB).
 * Good for tagging one scrutin at a time (e.g. during ingestion).
 */
export async function tagScrutin(
  scrutinId: string,
  titre: string,
  objetLibelle?: string | null
): Promise<void> {
  const tags = await getScrutinThematicTags();
  if (!tags || tags.length === 0) return;

  const rows = matchScrutinTags(scrutinId, titre, objetLibelle, tags);
  if (rows.length === 0) return;

  await supabase
    .from("scrutin_thematic_tags")
    .delete()
    .eq("scrutin_id", scrutinId);

  const { error } = await supabase
    .from("scrutin_thematic_tags")
    .insert(rows);
  if (error) {
    console.error(`Error inserting tags for scrutin ${scrutinId}:`, error);
  }
}

// ────────────────────────────────────────────────
// Batch helpers (used by tag-all-scrutins-cli)
// ────────────────────────────────────────────────

const UPSERT_CHUNK = 500;
const DELETE_CHUNK = 500;

/**
 * Batch-delete existing scrutin_thematic_tags for a set of scrutin IDs.
 */
export async function batchDeleteScrutinTags(
  scrutinIds: string[]
): Promise<void> {
  for (let i = 0; i < scrutinIds.length; i += DELETE_CHUNK) {
    const chunk = scrutinIds.slice(i, i + DELETE_CHUNK);
    const { error } = await supabase
      .from("scrutin_thematic_tags")
      .delete()
      .in("scrutin_id", chunk);
    if (error) {
      console.error(`Error batch-deleting scrutin tags (offset ${i}):`, error);
    }
  }
}

/**
 * Batch-upsert tag rows. Uses ON CONFLICT (scrutin_id, tag_id) DO UPDATE
 * so it's safe to re-run.
 */
export async function batchUpsertScrutinTags(
  rows: ScrutinTagRow[]
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from("scrutin_thematic_tags")
      .upsert(chunk, { onConflict: "scrutin_id,tag_id" });
    if (error) {
      console.error(`Error upserting scrutin tags (offset ${i}):`, error);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, errors };
}

/**
 * Remove all tags for a scrutin (useful for re-tagging)
 */
export async function removeScrutinTags(scrutinId: string): Promise<void> {
  await supabase
    .from("scrutin_thematic_tags")
    .delete()
    .eq("scrutin_id", scrutinId);
}
