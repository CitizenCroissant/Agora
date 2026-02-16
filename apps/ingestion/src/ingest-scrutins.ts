/**
 * Ingest scrutins (roll-call votes) from Assemblée nationale
 * Fetches Scrutins.json.zip, transforms, upserts scrutins and scrutin_votes
 */

import { supabase } from "./supabase";
import { scrutinsClient } from "./scrutins-client";
import { transformScrutin, extractScrutinVotes } from "./scrutins-transform";
import { AssembleeScrutin } from "./scrutins-types";
import { tagScrutin } from "./tag-scrutins";

export interface IngestScrutinsOptions {
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
}

/**
 * Resolve sitting_id for a scrutin: by seanceRef (official_id) or by date
 */
async function resolveSittingId(raw: AssembleeScrutin): Promise<string | null> {
  if (raw.seanceRef) {
    const { data: byOfficialId } = await supabase
      .from("sittings")
      .select("id")
      .eq("official_id", raw.seanceRef)
      .maybeSingle();
    if (byOfficialId?.id) return byOfficialId.id;
  }

  if (raw.dateScrutin) {
    const { data: byDate } = await supabase
      .from("sittings")
      .select("id")
      .eq("date", raw.dateScrutin)
      .limit(1)
      .maybeSingle();
    if (byDate?.id) return byDate.id;
  }

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
 * Extract a dossier/bill official_id from referenceLegislative or similar.
 * Handles formats like "DLR5L17N53735" or URLs containing the id.
 */
function extractDossierRefFromReference(ref: string | null | undefined): string | null {
  if (!ref || typeof ref !== "string") return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  // Match Assemblée dossier ID pattern: letters + digits (e.g. DLR5L17N53735)
  const match = trimmed.match(/([A-Z]{2,}[A-Z0-9]*\d{4,})/i);
  if (match) return match[1];
  // URL pattern: .../dossiers/XXXXX or .../dossier/...
  const urlMatch = trimmed.match(/dossiers?[/\-_]?([A-Za-z0-9]+)/i);
  if (urlMatch) return urlMatch[1];
  return null;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future amendment handling
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

  // Load all bills once for title-based fallback (open data often has dossierLegislatif = null)
  type BillRow = { id: string; title: string | null; short_title: string | null };
  const allBills: BillRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from("bills")
      .select("id, title, short_title")
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("Failed to fetch bills for title matching:", error);
      break;
    }
    if (!page?.length) break;
    allBills.push(...(page as BillRow[]));
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`Loaded ${allBills.length} bill(s) for title matching`);

  let inserted = 0;
  let votesInserted = 0;

  for (const raw of rawList) {
    if (dryRun) {
      console.log(
        "Dry run - would upsert scrutin:",
        raw.uid,
        raw.titre?.slice(0, 50)
      );
      continue;
    }

    const sittingId = await resolveSittingId(raw);
    const row = transformScrutin(raw, sittingId);

    const { data: scrutin, error: scrutError } = await supabase
      .from("scrutins")
      .upsert(row, {
        onConflict: "official_id",
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (scrutError) {
      console.error("Error upserting scrutin", raw.uid, scrutError);
      continue;
    }

    inserted++;

    // Link scrutin to its bill only when a bill already exists (from dossiers ingestion).
    // We never create or update bills here; only the dossiers ingestion does that.
    // For amendments we only link the scrutin to the main bill; we never create a bill row for the amendment.
    let bill: { id: string } | null = null;

    const tryBillByOfficialId = async (officialId: string): Promise<{ id: string } | null> => {
      const { data } = await supabase
        .from("bills")
        .select("id")
        .eq("official_id", officialId)
        .maybeSingle();
      return data ?? null;
    };

    // 1) objet.dossierLegislatif (primary)
    const dossierRef = raw.objet?.dossierLegislatif?.trim();
    if (dossierRef) bill = await tryBillByOfficialId(dossierRef);

    // 2) objet.referenceLegislative or demandeur.referenceLegislative (may contain dossier id or URL)
    if (!bill) {
      const refFromObjet = extractDossierRefFromReference(raw.objet?.referenceLegislative);
      if (refFromObjet) bill = await tryBillByOfficialId(refFromObjet);
    }
    if (!bill) {
      const refFromDemandeur = extractDossierRefFromReference(raw.demandeur?.referenceLegislative);
      if (refFromDemandeur) bill = await tryBillByOfficialId(refFromDemandeur);
    }

    // 3) Fallback: match by title when open data has no dossier ref (dossierLegislatif/referenceLegislative often null)
    if (!bill) {
      const libelle = (raw.objet?.libelle ?? raw.titre ?? "").trim();
      if (libelle.length >= 20) {
        const libelleNorm = normalizeForTitleMatch(libelle);
        let best: { id: string; len: number } | null = null;
        for (const b of allBills) {
          const title = (b.title || b.short_title || "").trim();
          if (title.length < 15) continue;
          const titleNorm = normalizeForTitleMatch(title);
          if (titleNorm.length < 15) continue;
          if (libelleNorm.includes(titleNorm) && (!best || titleNorm.length > best.len)) {
            best = { id: b.id, len: titleNorm.length };
          }
        }
        if (best) bill = { id: best.id };
      }
    }

    if (bill?.id) {
      const { error: linkError } = await supabase.from("bill_scrutins")
        .upsert(
          {
            bill_id: bill.id,
            scrutin_id: scrutin.id,
            role: null
          },
          {
            onConflict: "bill_id,scrutin_id",
            ignoreDuplicates: false
          }
        );
      if (linkError) {
        console.error(
          "Error linking bill to scrutin",
          bill.id,
          scrutin.id,
          linkError
        );
      }
    }

    // Replace scrutin_votes for this scrutin
    await supabase.from("scrutin_votes").delete().eq("scrutin_id", scrutin.id);
    const voteRows = extractScrutinVotes(raw, scrutin.id);
    if (voteRows.length > 0) {
      const { error: votesError } = await supabase
        .from("scrutin_votes")
        .insert(voteRows);
      if (votesError) {
        console.error(
          "Error inserting scrutin_votes for",
          scrutin.id,
          votesError
        );
      } else {
        votesInserted += voteRows.length;
      }
    }

    // Tag scrutin with thematic tags
    try {
      await tagScrutin(scrutin.id, row.titre, raw.objet?.libelle ?? null);
    } catch (tagError) {
      // Non-critical: log but don't fail ingestion
      console.error(
        `Error tagging scrutin ${scrutin.id}:`,
        tagError instanceof Error ? tagError.message : tagError
      );
    }
  }

  console.log(
    `Scrutins: ${inserted} upserted, ${votesInserted} vote rows inserted`
  );
  return { scrutins: inserted, scrutinVotes: votesInserted };
}
