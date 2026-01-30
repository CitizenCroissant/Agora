/**
 * Ingest scrutins (roll-call votes) from Assemblée nationale
 * Fetches Scrutins.json.zip, transforms, upserts scrutins and scrutin_votes
 */

import { supabase } from "./supabase";
import { scrutinsClient } from "./scrutins-client";
import { transformScrutin, extractScrutinVotes } from "./scrutins-transform";
import { AssembleeScrutin } from "./scrutins-types";

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
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export async function ingestScrutins(options: IngestScrutinsOptions = {}) {
  const { fromDate, toDate, dryRun = false } = options;

  let rawList: AssembleeScrutin[];
  if (fromDate && toDate) {
    rawList = await scrutinsClient.fetchScrutinsByDateRange(fromDate, toDate);
  } else {
    // Default: last 30 days (for cron; avoids processing full archive)
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
  }

  console.log(
    `Scrutins: ${inserted} upserted, ${votesInserted} vote rows inserted`,
  );
  return { scrutins: inserted, scrutinVotes: votesInserted };
}
