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
      (r): r is NonNullable<ReturnType<typeof transformDeputy>> => r != null
    );

  console.log(`Transformed ${rows.length} deputies`);

  if (dryRun) {
    rows.slice(0, 3).forEach((r) => {
      console.log("Would upsert:", r.acteur_ref, r.civil_prenom, r.civil_nom);
    });
    return { deputies: 0 };
  }

  // Upsert in batches to avoid one Supabase request per deputy,
  // which is too slow and can exceed the serverless timeout.
  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("deputies").upsert(batch, {
      onConflict: "acteur_ref",
      ignoreDuplicates: false
    });

    if (error) {
      console.error(
        `Error upserting deputies batch ${i}-${i + batch.length - 1}`,
        error
      );
      // Continue with next batches even if one fails
      continue;
    }

    upserted += batch.length;
  }

  console.log(`Deputies: ${upserted} upserted (out of ${rows.length})`);
  return { deputies: upserted };
}
