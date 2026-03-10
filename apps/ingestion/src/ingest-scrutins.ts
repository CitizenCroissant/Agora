/**
 * Ingest scrutins (roll-call votes) from Assemblée nationale
 * Fetches Scrutins.json.zip, transforms, upserts scrutins and scrutin_votes
 */

import { supabase } from "./supabase";
import { scrutinsClient } from "./scrutins-client";
import { transformScrutin, extractScrutinVotes } from "./scrutins-transform";
import { AssembleeScrutin } from "./scrutins-types";
import type { ScrutinInsert } from "./scrutins-types";
import {
  getScrutinThematicTags,
  matchScrutinTags,
  batchDeleteScrutinTags,
  batchUpsertScrutinTags
} from "./tag-scrutins";

export interface IngestScrutinsOptions {
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
}

/** Sitting lookup maps (preloaded once to avoid N round-trips). */
type SittingMaps = {
  byOfficialId: Map<string, string>;
  byDate: Map<string, string>;
};

/**
 * Preload sittings for all seanceRefs and dates in rawList. Build maps for O(1) lookup.
 */
async function preloadSittingMaps(rawList: AssembleeScrutin[]): Promise<SittingMaps> {
  const byOfficialId = new Map<string, string>();
  const byDate = new Map<string, string>();
  const refs = new Set<string>();
  const dates = new Set<string>();
  for (const raw of rawList) {
    if (raw.seanceRef) refs.add(raw.seanceRef);
    if (raw.dateScrutin) dates.add(raw.dateScrutin);
  }
  if (refs.size > 0) {
    const refList = [...refs];
    for (let i = 0; i < refList.length; i += 200) {
      const chunk = refList.slice(i, i + 200);
      const { data } = await supabase
        .from("sittings")
        .select("id, official_id")
        .in("official_id", chunk);
      (data || []).forEach((r: { id: string; official_id: string }) => byOfficialId.set(r.official_id, r.id));
    }
  }
  if (dates.size > 0) {
    const dateList = [...dates];
    for (let i = 0; i < dateList.length; i += 200) {
      const chunk = dateList.slice(i, i + 200);
      const { data } = await supabase
        .from("sittings")
        .select("id, date")
        .in("date", chunk);
      (data || []).forEach((r: { id: string; date: string }) => {
        if (!byDate.has(r.date)) byDate.set(r.date, r.id);
      });
    }
  }
  return { byOfficialId, byDate };
}

function resolveSittingIdFromMaps(raw: AssembleeScrutin, maps: SittingMaps): string | null {
  if (raw.seanceRef) {
    const id = maps.byOfficialId.get(raw.seanceRef);
    if (id) return id;
  }
  if (raw.dateScrutin) return maps.byDate.get(raw.dateScrutin) ?? null;
  return null;
}

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  // Default: last 7 days.
  // This is used by the scheduled cron job and is intentionally small enough
  // to keep the serverless function well under the execution timeout, while
  // still providing a safety window if a previous run failed.
  from.setDate(from.getDate() - 7);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0]
  };
}

/**
 * Very simple slug generator for grouping scrutins by underlying text.
 * Keeps it local to ingestion to avoid extra dependencies.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future bill key/title use
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Try to extract a canonical bill title from the scrutin title / objet.
 * Heuristic: keep from "proposition de loi", "projet de loi" or "résolution"
 * onward, and strip trailing lecture/parenthesis info.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future bill key/title use
function extractBillTitle(raw: AssembleeScrutin): string | null {
  const source = raw.objet?.libelle ?? raw.titre ?? null;
  if (!source) return null;

  const patterns = [
    /proposition de loi.*$/i,
    /projet de loi.*$/i,
    /résolution.*$/i
  ];

  let matchText: string | null = null;
  for (const re of patterns) {
    const m = source.match(re);
    if (m) {
      matchText = m[0];
      break;
    }
  }

  const base = matchText ?? source;
  // Remove trailing parenthetical like "(première lecture)."
  const cleaned = base.replace(/\s*\([^)]*lecture[^)]*\)\.?$/i, "").trim();
  return cleaned || null;
}

/**
 * Get a string from an object by trying several key names (camelCase, PascalCase, common variants).
 * Source JSON may use different conventions than our types.
 */
function getStringFromKeys(
  obj: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | null {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Normalize referenceLegislative: may be a string or an object with a string ref (e.g. { "@value": "..." }).
 */
function referenceToString(ref: unknown): string | null {
  if (ref == null) return null;
  if (typeof ref === "string" && ref.trim()) return ref.trim();
  if (typeof ref === "object" && ref !== null) {
    const o = ref as Record<string, unknown>;
    const v =
      o["@value"] ?? o.value ?? o.ref ?? o.uid ?? o.dossierRef ?? o["#text"];
    if (v != null && typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Extract a dossier/bill official_id from referenceLegislative or similar.
 * Handles formats like "DLR5L17N53735" or URLs containing the id.
 * ref may be a string or an object (e.g. { "@value": "DLR5L17N53735" }).
 */
function extractDossierRefFromReference(ref: unknown): string | null {
  const str = referenceToString(ref);
  if (!str) return null;
  // Match Assemblée dossier ID pattern: letters + digits (e.g. DLR5L17N53735)
  const match = str.match(/([A-Z]{2,}[A-Z0-9]*\d{4,})/i);
  if (match) return match[1];
  // URL pattern: .../dossiers/XXXXX or .../dossier/...
  const urlMatch = str.match(/dossiers?[/\-_]?([A-Za-z0-9]+)/i);
  if (urlMatch) return urlMatch[1];
  return null;
}

/**
 * Collect all candidate dossier refs from a raw scrutin, trying multiple key names
 * (source open data may use PascalCase or different field names).
 */
function collectDossierRefsFromRaw(raw: AssembleeScrutin): string[] {
  const refs: string[] = [];
  const rawAny = raw as unknown as Record<string, unknown>;

  const objet = (rawAny.objet ?? rawAny.Objet) as Record<string, unknown> | undefined;
  if (objet && typeof objet === "object") {
    const directRef = getStringFromKeys(
      objet,
      "dossierLegislatif",
      "DossierLegislatif",
      "refDossierLegislatif",
      "dossierRef",
      "refDossier"
    );
    if (directRef) refs.push(directRef);
    const refLeg = objet.referenceLegislative ?? objet.ReferenceLegislative;
    const parsed = extractDossierRefFromReference(refLeg);
    if (parsed) refs.push(parsed);
  }

  const demandeur = (rawAny.demandeur ?? rawAny.Demandeur) as Record<string, unknown> | undefined;
  if (demandeur && typeof demandeur === "object") {
    const refLeg = demandeur.referenceLegislative ?? demandeur.ReferenceLegislative;
    const parsed = extractDossierRefFromReference(refLeg);
    if (parsed) refs.push(parsed);
  }

  // Root-level ref (some exports put dossier ref at scrutin root)
  const rootRef = getStringFromKeys(
    rawAny,
    "dossierLegislatif",
    "DossierLegislatif",
    "refDossierLegislatif",
    "dossierRef"
  );
  if (rootRef) refs.push(rootRef);

  return refs;
}

/**
 * Normalize text for title matching: lowercase, collapse spaces, remove lecture parentheticals.
 */
function normalizeForTitleMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*lecture[^)]*\)\.?/gi, "")
    .trim();
}

/** True if the scrutin is about an amendment (vote on an amendement). */
function isAmendmentScrutin(raw: AssembleeScrutin): boolean {
  const text = [
    raw.titre,
    raw.objet?.libelle,
    raw.demandeur?.texte
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes("amendement");
}

/**
 * Parse amendment number(s) from scrutin titre and objet.libelle.
 * Matches "amendement n° 123", "amendements n° 10, 11 et 12", "n° 456 (rect.)", etc.
 * Returns unique numeros (as strings) for lookup in amendments table.
 */
function parseAmendmentNumbers(
  titre: string | null,
  libelle: string | null
): string[] {
  const text = [titre, libelle].filter(Boolean).join(" ") || "";
  const numbers = new Set<string>();
  // n° 123 or n°123 or n º 123 (various Unicode)
  const regex = /(?:amendement(?:s)?\s+)?n[°ºo]\s*(\d+)(?:\s*\([^)]*\))?|(?:amendement(?:s)?\s+)?n[°ºo](\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const num = (m[1] ?? m[2] ?? "").trim();
    if (num) numbers.add(num);
  }
  // Also catch "amendement 123" without symbol
  const fallback = /amendement(?:s)?\s+(\d+)(?:\s|,|et|$)/gi;
  while ((m = fallback.exec(text)) !== null) {
    if (m[1]) numbers.add(m[1].trim());
  }
  return [...numbers];
}

/**
 * Extract "projet de loi ..." / "proposition de loi ..." / "résolution ..." from libelle for title matching.
 * Amendment text often contains "de la proposition de loi X" or "au projet de loi X"; this gives a segment we can match to bill titles.
 */
function extractBillSegmentFromLibelle(libelle: string): string | null {
  const trimmed = libelle.trim();
  if (trimmed.length < 10) return null;
  const patterns = [
    /(proposition de loi.*)$/i,
    /(projet de loi.*)$/i,
    /(résolution.*)$/i
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m && m[1]) {
      const segment = m[1]
        .replace(/\s*\([^)]*lecture[^)]*\)\.?$/i, "")
        .trim();
      if (segment.length >= 15) return segment;
    }
  }
  return null;
}

/** Pre-normalized bill for fast title matching (compute once per bill). */
type BillNorm = { id: string; titleNorm: string; len: number };

/**
 * Strip "proposition de loi ... visant à" / "projet de loi ..." prefix.
 * Dossier titles are often "Empêcher la constitution..." while amendment text says "proposition de loi visant à empêcher...".
 */
function coreSubstantiveTitle(segmentNorm: string): string {
  return segmentNorm
    .replace(
      /^(?:proposition de loi|projet de loi)(?:\s+visant a|\s+portant sur|\s+relatif a)?\s+/i,
      ""
    )
    .trim();
}

const TITLE_PREFIX_MATCH_LEN = 38;

/**
 * Find best matching bill by title using pre-normalized bill list. Returns bill id or null.
 */
function findBillByTitleMatch(
  libelle: string,
  billsNormalized: BillNorm[]
): string | null {
  if (libelle.length < 20) return null;
  const libelleNorm = normalizeForTitleMatch(libelle);
  const segment = extractBillSegmentFromLibelle(libelle);
  const segmentNorm = segment ? normalizeForTitleMatch(segment) : null;
  const coreNorm =
    segmentNorm && segmentNorm.length >= 20 ? coreSubstantiveTitle(segmentNorm) : null;
  let best: { id: string; len: number } | null = null;
  for (const b of billsNormalized) {
    const fullMatch = libelleNorm.includes(b.titleNorm);
    const segmentMatch =
      segmentNorm &&
      (segmentNorm.includes(b.titleNorm) || b.titleNorm.includes(segmentNorm));
    const corePrefixMatch =
      coreNorm &&
      coreNorm.length >= TITLE_PREFIX_MATCH_LEN &&
      b.titleNorm.length >= TITLE_PREFIX_MATCH_LEN &&
      (coreNorm.slice(0, TITLE_PREFIX_MATCH_LEN) ===
        b.titleNorm.slice(0, TITLE_PREFIX_MATCH_LEN) ||
        coreNorm.includes(b.titleNorm) ||
        b.titleNorm.includes(coreNorm));
    if (
      (fullMatch || segmentMatch || corePrefixMatch) &&
      (!best || b.len > best.len)
    ) {
      best = { id: b.id, len: b.len };
    }
  }
  return best?.id ?? null;
}

export async function ingestScrutins(options: IngestScrutinsOptions = {}) {
  const { fromDate, toDate, dryRun = false } = options;

  let rawList: AssembleeScrutin[];
  if (fromDate && toDate) {
    rawList = await scrutinsClient.fetchScrutinsByDateRange(fromDate, toDate);
  } else {
    // Default: last 7 days (for cron; avoids processing full archive and
    // keeps runtime within the serverless max duration).
    const { from, to } = getDefaultDateRange();
    rawList = await scrutinsClient.fetchScrutinsByDateRange(from, to);
  }

  console.log(`Processing ${rawList.length} scrutin(s)`);

  if (dryRun) {
    for (const raw of rawList.slice(0, 5)) {
      console.log("Dry run - would upsert scrutin:", raw.uid, raw.titre?.slice(0, 50));
    }
    if (rawList.length > 5) console.log(`... and ${rawList.length - 5} more`);
    return { scrutins: 0, scrutinVotes: 0 };
  }

  // Preload sittings (one-off) for O(1) resolve per scrutin
  console.log("Preloading sittings...");
  const sittingMaps = await preloadSittingMaps(rawList);
  console.log(`  by official_id: ${sittingMaps.byOfficialId.size}, by date: ${sittingMaps.byDate.size}`);

  // Load bills with official_id for ref lookup + pre-normalize titles for matching (one-off)
  type BillRow = { id: string; official_id: string; title: string | null; short_title: string | null };
  const allBills: BillRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from("bills")
      .select("id, official_id, title, short_title")
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("Failed to fetch bills:", error);
      break;
    }
    if (!page?.length) break;
    allBills.push(...(page as BillRow[]));
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`Loaded ${allBills.length} bill(s)`);

  const billByOfficialId = new Map<string, string>();
  for (const b of allBills) {
    if (b.official_id) billByOfficialId.set(b.official_id, b.id);
  }

  const billsNormalized: BillNorm[] = [];
  for (const b of allBills) {
    const title = (b.title || b.short_title || "").trim();
    if (title.length < 15) continue;
    const titleNorm = normalizeForTitleMatch(title);
    if (titleNorm.length < 15) continue;
    billsNormalized.push({ id: b.id, titleNorm, len: titleNorm.length });
  }
  billsNormalized.sort((a, b) => b.len - a.len);

  const tags = await getScrutinThematicTags();
  if (!tags?.length) console.warn("No thematic tags loaded; skipping tag linking.");

  // Load amendments for scrutin → amendment linking (amendments are per bill_text; we group by bill_id)
  type AmendmentRow = { id: string; numero: string };
  const billTextIdToBillId = new Map<string, string>();
  offset = 0;
  while (true) {
    const { data: btPage, error: btErr } = await supabase
      .from("bill_texts")
      .select("id, bill_id")
      .range(offset, offset + PAGE - 1);
    if (btErr) {
      console.warn("Failed to load bill_texts for linking:", btErr.message);
      break;
    }
    if (!btPage?.length) break;
    for (const r of btPage as { id: string; bill_id: string }[]) {
      billTextIdToBillId.set(r.id, r.bill_id);
    }
    if (btPage.length < PAGE) break;
    offset += PAGE;
  }
  const amendmentsByBill = new Map<string, AmendmentRow[]>();
  offset = 0;
  while (true) {
    const { data: ampPage, error: ampErr } = await supabase
      .from("amendments")
      .select("id, bill_text_id, numero")
      .range(offset, offset + PAGE - 1);
    if (ampErr) {
      console.warn("Failed to load amendments for linking:", ampErr.message);
      break;
    }
    if (!ampPage?.length) break;
    for (const a of ampPage as { id: string; bill_text_id: string; numero: string }[]) {
      const billId = billTextIdToBillId.get(a.bill_text_id);
      if (!billId) continue;
      const list = amendmentsByBill.get(billId) ?? [];
      list.push({ id: a.id, numero: a.numero });
      amendmentsByBill.set(billId, list);
    }
    if (ampPage.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`Loaded amendments for ${amendmentsByBill.size} bill(s) (via bill_texts)`);

  /** Find amendment ids for (bill_id, parsed numero). Matches exact or "123 rect." etc. */
  function findAmendmentIdsForNumero(billId: string, parsedNumero: string): string[] {
    const list = amendmentsByBill.get(billId);
    if (!list) return [];
    return list
      .filter(
        (a) =>
          a.numero === parsedNumero ||
          a.numero.startsWith(parsedNumero + " ") ||
          a.numero.startsWith(parsedNumero + "(")
      )
      .map((a) => a.id);
  }

  const BATCH = 80;
  const VOTE_INSERT_CHUNK = 1000;
  let inserted = 0;
  let votesInserted = 0;
  let scrutinAmendmentLinks = 0;

  for (let i = 0; i < rawList.length; i += BATCH) {
    const batch = rawList.slice(i, i + BATCH);

    const rows: ScrutinInsert[] = [];
    for (const raw of batch) {
      const sittingId = resolveSittingIdFromMaps(raw, sittingMaps);
      rows.push(transformScrutin(raw, sittingId));
    }

    const { data: upserted, error: scrutError } = await supabase
      .from("scrutins")
      .upsert(rows, { onConflict: "official_id", ignoreDuplicates: false })
      .select("id, official_id");

    if (scrutError) {
      console.error("Batch scrutin upsert error:", scrutError);
      continue;
    }
    const scrutinById = new Map<string, { id: string; official_id: string }>();
    (upserted || []).forEach((r: { id: string; official_id: string }) => scrutinById.set(r.official_id, r));

    const billScrutinRows: { bill_id: string; scrutin_id: string; role: null }[] = [];
    const scrutinAmendmentRows: { scrutin_id: string; amendment_id: string }[] = [];
    const allVoteRows: { scrutin_id: string; acteur_ref: string; position: "pour" | "contre" | "abstention" | "non_votant" }[] = [];
    const tagRows: { scrutin_id: string; tag_id: string; source: string; confidence: number }[] = [];
    const batchIds: string[] = [];

    for (let j = 0; j < batch.length; j++) {
      const raw = batch[j];
      const row = rows[j];
      const rec = scrutinById.get(raw.uid);
      if (!rec) continue;
      batchIds.push(rec.id);
      inserted++;

      let billId: string | null = null;
      const dossierRefs = collectDossierRefsFromRaw(raw);
      for (const ref of dossierRefs) {
        billId = billByOfficialId.get(ref) ?? null;
        if (billId) break;
      }
      if (!billId) {
        const libelle = (raw.objet?.libelle ?? raw.titre ?? "").trim();
        billId = findBillByTitleMatch(libelle, billsNormalized);
      }
      if (billId) billScrutinRows.push({ bill_id: billId, scrutin_id: rec.id, role: null });

      if (billId && isAmendmentScrutin(raw)) {
        const numeros = parseAmendmentNumbers(row.titre, raw.objet?.libelle ?? null);
        for (const num of numeros) {
          const amendmentIds = findAmendmentIdsForNumero(billId, num);
          for (const amendmentId of amendmentIds) {
            scrutinAmendmentRows.push({ scrutin_id: rec.id, amendment_id: amendmentId });
          }
        }
      }

      const voteRows = extractScrutinVotes(raw, rec.id);
      allVoteRows.push(...voteRows);

      if (tags?.length) {
        const matched = matchScrutinTags(rec.id, row.titre, raw.objet?.libelle ?? null, tags);
        tagRows.push(...matched);
      }
    }

    if (batchIds.length === 0) continue;

    await supabase.from("scrutin_votes").delete().in("scrutin_id", batchIds);

    for (let v = 0; v < allVoteRows.length; v += VOTE_INSERT_CHUNK) {
      const chunk = allVoteRows.slice(v, v + VOTE_INSERT_CHUNK);
      const { error: votesError } = await supabase.from("scrutin_votes").insert(chunk);
      if (votesError) console.error("Batch vote insert error:", votesError);
      else votesInserted += chunk.length;
    }

    if (billScrutinRows.length > 0) {
      const { error: linkError } = await supabase
        .from("bill_scrutins")
        .upsert(billScrutinRows, { onConflict: "bill_id,scrutin_id", ignoreDuplicates: false });
      if (linkError) console.error("Batch bill_scrutins upsert error:", linkError);
    }

    if (scrutinAmendmentRows.length > 0) {
      const unique = Array.from(
        new Map(scrutinAmendmentRows.map((r) => [`${r.scrutin_id}:${r.amendment_id}`, r])).values()
      );
      await supabase.from("scrutin_amendments").delete().in("scrutin_id", batchIds);
      const { error: amErr } = await supabase.from("scrutin_amendments").insert(unique);
      if (amErr) console.error("Batch scrutin_amendments insert error:", amErr);
      else scrutinAmendmentLinks += unique.length;
    }

    if (tags?.length && tagRows.length > 0) {
      await batchDeleteScrutinTags(batchIds);
      await batchUpsertScrutinTags(tagRows);
    }

    if ((i + BATCH) % 500 < BATCH || i + BATCH >= rawList.length) {
      console.log(`  Progress: ${Math.min(i + BATCH, rawList.length)}/${rawList.length} scrutins`);
    }
  }

  console.log(
    `Scrutins: ${inserted} upserted, ${votesInserted} vote rows, ${scrutinAmendmentLinks} scrutin→amendment links`
  );
  return {
    scrutins: inserted,
    scrutinVotes: votesInserted,
    scrutinAmendmentLinks
  };
}
