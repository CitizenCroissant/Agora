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
import type { AssembleeSeance } from "./types";

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
    const leg = options.legislature ?? "17";
    const dates = getDatesToFetch(options);
    console.log(`Fetching data for ${dates.length} date(s)`);

    let totalSittings = 0;
    let totalItems = 0;

    if (options.fromDate && options.toDate && dates.length > 1) {
      // Range path: fetch archive once, group by date, then process each date
      console.log(`Range backfill: fetching seances and commission reunions for ${options.fromDate}..${options.toDate}`);
      const [seancesRange, commissionReunionsRange] = await Promise.all([
        assembleeClient.fetchSeancesRange(options.fromDate, options.toDate, leg),
        assembleeClient.fetchCommissionReunionsRange(options.fromDate, options.toDate, leg)
      ]);
      const allSeancesRange = [...seancesRange, ...commissionReunionsRange];
      const byDate = new Map<string, AssembleeSeance[]>();
      for (const s of allSeancesRange) {
        const d = s.dateSeance.split("T")[0];
        if (!byDate.has(d)) byDate.set(d, []);
        byDate.get(d)!.push(s);
      }
      const sortedDates = Array.from(byDate.keys()).sort();
      console.log(`Fetched ${allSeancesRange.length} seance(s)/reunion(s) across ${sortedDates.length} dates`);

      for (const date of sortedDates) {
        const allSeances = byDate.get(date)!;
        const result = await processDate(date, allSeances, options);
        totalSittings += result.sittingsCount;
        totalItems += result.itemsCount;
      }
    } else {
      // Per-date path: fetch and process each date (e.g. single --date or default 7 days)
      for (const date of dates) {
        console.log(`Processing date: ${date}`);
        const [seances, commissionReunions] = await Promise.all([
          assembleeClient.fetchSeances(date, leg),
          assembleeClient.fetchCommissionReunions(date, leg)
        ]);
        const allSeances = [...seances, ...commissionReunions];
        console.log(`Found ${seances.length} seance(s), ${commissionReunions.length} commission reunion(s)`);
        const result = await processDate(date, allSeances, options);
        totalSittings += result.sittingsCount;
        totalItems += result.itemsCount;
      }
    }

    console.log("Ingestion complete!");
    console.log(`Total sittings: ${totalSittings}`);
    console.log(`Total agenda items: ${totalItems}`);

    // Ingest legislative dossiers (bills) from the official dataset (once per run).
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
 * Process one day's seances: upsert sittings, agenda items, and source metadata.
 * Returns counts for this date.
 */
async function processDate(
  date: string,
  allSeances: AssembleeSeance[],
  options: IngestOptions
): Promise<{ sittingsCount: number; itemsCount: number }> {
  if (allSeances.length === 0) return { sittingsCount: 0, itemsCount: 0 };

  if (options.dryRun) {
    for (const seance of allSeances) {
      console.log("Dry run - would upsert:", {
        official_id: seance.uid,
        date: seance.dateSeance,
        type: seance.typeSeance,
        items: seance.pointsOdj?.length || 0
      });
    }
    return { sittingsCount: 0, itemsCount: 0 };
  }

  const sittingsData = allSeances.map((s) => transformSeance(s));

  const { data: sittings, error: sittingsError } = await supabase
    .from("sittings")
    .upsert(sittingsData, {
      onConflict: "official_id",
      ignoreDuplicates: false
    })
    .select();

  if (sittingsError || !sittings) {
    console.error(`Error upserting sittings for ${date}:`, sittingsError);
    return { sittingsCount: 0, itemsCount: 0 };
  }

  console.log(`${date}: upserted ${sittings.length} sitting(s)`);

  const sittingMap = new Map<string, string>();
  for (const sitting of sittings) {
    sittingMap.set(sitting.official_id, sitting.id);
  }

  const sittingIds = sittings.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from("agenda_items")
    .delete()
    .in("sitting_id", sittingIds);

  if (deleteError) {
    console.error("Error deleting agenda items:", deleteError);
  }

  const allAgendaItems: ReturnType<typeof transformAgendaItems> = [];
  const allMetadata: ReturnType<typeof createSourceMetadata>[] = [];

  for (const seance of allSeances) {
    const sittingId = sittingMap.get(seance.uid);
    if (!sittingId) continue;
    allAgendaItems.push(...transformAgendaItems(seance, sittingId));
    allMetadata.push(createSourceMetadata(seance, sittingId));
  }

  let itemsCount = 0;
  if (allAgendaItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("agenda_items")
      .insert(allAgendaItems);
    if (itemsError) {
      console.error("Error inserting agenda items:", itemsError);
    } else {
      console.log(`${date}: inserted ${allAgendaItems.length} agenda item(s)`);
      itemsCount = allAgendaItems.length;
    }
  }

  if (allMetadata.length > 0) {
    const { error: metadataError } = await supabase
      .from("source_metadata")
      .upsert(allMetadata, { onConflict: "sitting_id" });
    if (metadataError) {
      console.error("Error upserting source metadata:", metadataError);
    }
  }

  return { sittingsCount: sittings.length, itemsCount };
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
