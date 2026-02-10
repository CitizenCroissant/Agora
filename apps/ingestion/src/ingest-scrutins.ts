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
    to: to.toISOString().split("T")[0],
  };
}

/**
 * Very simple slug generator for grouping scrutins by underlying text.
 * Keeps it local to ingestion to avoid extra dependencies.
 */
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
function extractBillTitle(raw: AssembleeScrutin): string | null {
  const source = raw.objet?.libelle ?? raw.titre ?? null;
  if (!source) return null;

  const patterns = [
    /proposition de loi.*$/i,
    /projet de loi.*$/i,
    /résolution.*$/i,
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
 * Compute a stable internal key + human title for the bill this scrutin belongs to.
 */
function getBillKey(
  raw: AssembleeScrutin,
): { key: string; title: string } | null {
  const title = extractBillTitle(raw);
  if (!title) return null;
  const key = slugify(title);
  if (!key) return null;
  return { key, title };
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

  let inserted = 0;
  let votesInserted = 0;

  for (const raw of rawList) {
    if (dryRun) {
      console.log(
        "Dry run - would upsert scrutin:",
        raw.uid,
        raw.titre?.slice(0, 50),
      );
      continue;
    }

    const sittingId = await resolveSittingId(raw);
    const row = transformScrutin(raw, sittingId);

    const { data: scrutin, error: scrutError } = await supabase
      .from("scrutins")
      .upsert(row, {
        onConflict: "official_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (scrutError) {
      console.error("Error upserting scrutin", raw.uid, scrutError);
      continue;
    }

    inserted++;

    // Link scrutin to its bill (text) when we can infer a stable key from the title
    const billKey = getBillKey(raw);
    if (billKey) {
      const shortTitle = raw.titre ?? row.titre ?? null;

      const { data: bill, error: billError } = await supabase
        .from("bills")
        .upsert(
          {
            official_id: billKey.key,
            title: billKey.title,
            short_title: shortTitle,
            // type, origin, official_url can be enriched later from other datasets
            type: null,
            origin: null,
            official_url: null,
          },
          {
            onConflict: "official_id",
            ignoreDuplicates: false,
          },
        )
        .select()
        .maybeSingle();

      if (billError) {
        console.error(
          "Error upserting bill for scrutin",
          raw.uid,
          billKey.key,
          billError,
        );
      } else if (bill?.id) {
        const { error: linkError } = await supabase.from("bill_scrutins")
          .upsert(
            {
              bill_id: bill.id,
              scrutin_id: scrutin.id,
              role: null,
            },
            {
              onConflict: "bill_id,scrutin_id",
              ignoreDuplicates: false,
            },
          );

        if (linkError) {
          console.error(
            "Error linking bill to scrutin",
            bill.id,
            scrutin.id,
            linkError,
          );
        }
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
          votesError,
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
        tagError instanceof Error ? tagError.message : tagError,
      );
    }
  }

  console.log(
    `Scrutins: ${inserted} upserted, ${votesInserted} vote rows inserted`,
  );
  return { scrutins: inserted, scrutinVotes: votesInserted };
}
