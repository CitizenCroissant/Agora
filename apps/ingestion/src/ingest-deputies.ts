/**
 * Ingest deputies (acteurs) from Assemblée nationale AMO data
 * Fetches AMO acteurs/mandats, transforms and upserts deputies.
 * Circonscriptions must already exist (run ingest:circonscriptions from official source first).
 */

import { supabase } from "./supabase";
import { deputiesClient } from "./deputies-client";
import { transformDeputy } from "./deputies-transform";

export interface IngestDeputiesOptions {
  dryRun?: boolean;
}

export async function ingestDeputies(options: IngestDeputiesOptions = {}) {
  const { dryRun = false } = options;

  const raw = await deputiesClient.fetchAllDeputies();
  const rows = raw
    .map(transformDeputy)
    .filter(
      (r): r is NonNullable<ReturnType<typeof transformDeputy>> => r != null,
    );

  console.log(`Transformed ${rows.length} deputies`);

  if (dryRun) {
    rows.slice(0, 3).forEach((r) => {
      console.log("Would upsert:", r.acteur_ref, r.civil_prenom, r.civil_nom);
    });
    return { deputies: 0 };
  }

  let upserted = 0;
  for (const row of rows) {
    const { error } = await supabase.from("deputies").upsert(row, {
      onConflict: "acteur_ref",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error("Error upserting deputy", row.acteur_ref, error);
    } else {
      upserted++;
    }
  }

  console.log(`Deputies: ${upserted} upserted`);
  return { deputies: upserted };
}
