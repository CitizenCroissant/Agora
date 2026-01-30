/**
 * Ingest circonscriptions from official source (data.gouv.fr GeoJSON)
 * Fetches Contours géographiques des circonscriptions législatives,
 * parses features and upserts id, label and geometry into circonscriptions table.
 */

import { supabase } from "./supabase";
import { fetchCirconscriptionsFromSource } from "./circonscriptions-client";

export interface IngestCirconscriptionsOptions {
  dryRun?: boolean;
}

export async function ingestCirconscriptions(
  options: IngestCirconscriptionsOptions = {},
) {
  const { dryRun = false } = options;

  const list = await fetchCirconscriptionsFromSource();

  if (dryRun) {
    list.slice(0, 5).forEach((c) => {
      console.log("Would upsert:", c.id, c.label);
    });
    console.log(`... and ${list.length - 5} more`);
    return { circonscriptions: 0 };
  }

  let upserted = 0;
  for (const { id, label, geometry } of list) {
    const { error } = await supabase
      .from("circonscriptions")
      .upsert(
        { id, label, geometry: geometry ?? null },
        { onConflict: "id", ignoreDuplicates: false },
      );
    if (error) {
      console.error("Error upserting circonscription", id, error);
    } else {
      upserted++;
    }
  }

  console.log(`Circonscriptions: ${upserted} upserted`);
  return { circonscriptions: upserted };
}
