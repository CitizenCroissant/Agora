/**
 * Main ingestion logic
 * Fetches data from Assemblée nationale and upserts into Supabase
 */

import { supabase } from "./supabase";
import { assembleeClient } from "./assemblee-client";
import {
  transformSeance,
  transformAgendaItems,
  createSourceMetadata
} from "./transform";
import { ingestDossiers } from "./ingest-dossiers";

export interface IngestOptions {
  date?: string;
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
  /** Legislature: "14"-"17" or "all". Applies to both sittings and dossiers. Default "17". */
  legislature?: string;
}

export async function ingest(options: IngestOptions = {}) {
  console.log("Starting ingestion...", options);

  try {
    // Determine dates to fetch
    const dates = getDatesToFetch(options);
    console.log(`Fetching data for ${dates.length} date(s)`);

    let totalSittings = 0;
    let totalItems = 0;

    for (const date of dates) {
      console.log(`Processing date: ${date}`);

      // Fetch seances from Assemblée API
      const seances = await assembleeClient.fetchSeances(date, options.legislature ?? "17");
      console.log(`Found ${seances.length} seance(s)`);

      if (seances.length === 0) continue;

      if (options.dryRun) {
        for (const seance of seances) {
          console.log("Dry run - would upsert:", {
            official_id: seance.uid,
            date: seance.dateSeance,
            items: seance.pointsOdj?.length || 0
          });
        }
        continue;
      }

      // Batch upsert all sittings for this date
      const sittingsData = seances.map((s) => transformSeance(s));

      const { data: sittings, error: sittingsError } = await supabase
        .from("sittings")
        .upsert(sittingsData, {
          onConflict: "official_id",
          ignoreDuplicates: false
        })
        .select();

      if (sittingsError || !sittings) {
        console.error("Error upserting sittings:", sittingsError);
        continue;
      }

      console.log(`Upserted ${sittings.length} sitting(s)`);
      totalSittings += sittings.length;

      // Build a map from official_id → sitting UUID
      const sittingMap = new Map<string, string>();
      for (const sitting of sittings) {
        sittingMap.set(sitting.official_id, sitting.id);
      }

      // Batch delete existing agenda items for all sittings of this date
      const sittingIds = sittings.map((s) => s.id);
      const { error: deleteError } = await supabase
        .from("agenda_items")
        .delete()
        .in("sitting_id", sittingIds);

      if (deleteError) {
        console.error("Error deleting agenda items:", deleteError);
      }

      // Collect all agenda items and source metadata for this date
      const allAgendaItems: ReturnType<typeof transformAgendaItems> = [];
      const allMetadata: ReturnType<typeof createSourceMetadata>[] = [];

      for (const seance of seances) {
        const sittingId = sittingMap.get(seance.uid);
        if (!sittingId) continue;

        allAgendaItems.push(...transformAgendaItems(seance, sittingId));
        allMetadata.push(createSourceMetadata(seance, sittingId));
      }

      // Batch insert all agenda items for this date
      if (allAgendaItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("agenda_items")
          .insert(allAgendaItems);

        if (itemsError) {
          console.error("Error inserting agenda items:", itemsError);
        } else {
          console.log(`Inserted ${allAgendaItems.length} agenda item(s)`);
          totalItems += allAgendaItems.length;
        }
      }

      // Batch upsert source metadata for this date
      if (allMetadata.length > 0) {
        const { error: metadataError } = await supabase
          .from("source_metadata")
          .upsert(allMetadata, { onConflict: "sitting_id" });

        if (metadataError) {
          console.error("Error upserting source metadata:", metadataError);
        }
      }
    }

    console.log("Ingestion complete!");
    console.log(`Total sittings: ${totalSittings}`);
    console.log(`Total agenda items: ${totalItems}`);

    // Ingest legislative dossiers (bills) from the official dataset.
    const dossiersResult = await ingestDossiers({
      dryRun: options.dryRun ?? false,
      legislature: options.legislature ?? "17"
    });

    console.log("Dossiers ingestion summary:", dossiersResult);

    return {
      success: true,
      totalSittings,
      totalItems,
      totalDossiers: dossiersResult.totalDossiers
    };
  } catch (error) {
    console.error("Ingestion failed:", error);
    throw error;
  }
}

/**
 * Determine which dates to fetch based on options
 */
function getDatesToFetch(options: IngestOptions): string[] {
  if (options.date) {
    return [options.date];
  }

  if (options.fromDate && options.toDate) {
    return getDateRange(options.fromDate, options.toDate);
  }

  // Default: today and next 7 days
  const today = new Date();
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Get array of dates between from and to (inclusive)
 */
function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: IngestOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" && args[i + 1]) {
      options.date = args[i + 1];
      i++;
    } else if (args[i] === "--from" && args[i + 1]) {
      options.fromDate = args[i + 1];
      i++;
    } else if (args[i] === "--to" && args[i + 1]) {
      options.toDate = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--legislature" && args[i + 1]) {
      options.legislature = args[i + 1];
      i++;
    }
  }

  ingest(options).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
