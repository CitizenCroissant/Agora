/**
 * Main ingestion logic
 * Fetches data from Assemblée nationale and upserts into Supabase
 */

import { supabase } from "./supabase";
import { assembleeClient } from "./assemblee-client";
import {
  transformSeance,
  transformAgendaItems,
  createSourceMetadata,
} from "./transform";
import { ingestDossiers } from "./ingest-dossiers";

export interface IngestOptions {
  date?: string;
  fromDate?: string;
  toDate?: string;
  dryRun?: boolean;
  /** Legislature for dossiers (bills): "17", "16", or "all". Default "17" (used by cron). */
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
      const seances = await assembleeClient.fetchSeances(date);
      console.log(`Found ${seances.length} seance(s)`);

      for (const seance of seances) {
        if (options.dryRun) {
          console.log("Dry run - would upsert:", {
            official_id: seance.uid,
            date: seance.dateSeance,
            items: seance.pointsOdj?.length || 0,
          });
          continue;
        }

        // Transform and upsert sitting
        const sittingData = transformSeance(seance);

        const { data: sitting, error: sittingError } = await supabase
          .from("sittings")
          .upsert(sittingData, {
            onConflict: 'official_id',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (sittingError) {
          console.error('Error upserting sitting:', sittingError);
          continue;
        }

        console.log(`Upserted sitting: ${sitting.id}`);
        totalSittings++;

        // Delete existing agenda items for this sitting (to handle updates)
        await supabase
          .from("agenda_items")
          .delete()
          .eq('sitting_id', sitting.id);

        // Insert agenda items
        const agendaItemsData = transformAgendaItems(seance, sitting.id);
        if (agendaItemsData.length > 0) {
          const { error: itemsError } = await supabase
            .from("agenda_items")
            .insert(agendaItemsData);

          if (itemsError) {
            console.error('Error inserting agenda items:', itemsError);
          } else {
            console.log(`Inserted ${agendaItemsData.length} agenda item(s)`);
            totalItems += agendaItemsData.length;
          }
        }

        // Upsert source metadata
        const metadataData = createSourceMetadata(seance, sitting.id);
        const { error: metadataError } = await supabase
          .from('source_metadata')
          .upsert(
            { ...metadataData, id: undefined },
            { onConflict: 'sitting_id' }
          );

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
      legislature: options.legislature ?? "17",
    });

    console.log("Dossiers ingestion summary:", dossiersResult);

    return {
      success: true,
      totalSittings,
      totalItems,
      totalDossiers: dossiersResult.totalDossiers,
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
