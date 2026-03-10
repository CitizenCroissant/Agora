/**
 * Ingest lightweight amendment list from Assemblée nationale Amendements.json.zip.
 * Run after dossier ingestion. Bill textes (bill_texts) are created by dossier ingestion
 * from actes (texte_associe, texte_adopte). This job only inserts amendments into existing
 * bill_texts; it does not create bill_texts.
 */

import { supabase } from "./supabase";
import {
  fetchAmendmentListForLegislature,
  mapAmendmentsToBillTexts,
  billTextMapKey
} from "./amendments-client";
import type { AmendmentInsert } from "./amendments-types";

export interface IngestAmendmentsOptions {
  /** Legislature to fetch (e.g. "17"). Default "17". */
  legislature?: string;
  dryRun?: boolean;
}

const PAGE = 1000;

export async function ingestAmendments(
  options: IngestAmendmentsOptions = {}
): Promise<{ totalAmendments: number }> {
  const legislature = options.legislature ?? "17";
  console.log("Starting amendments ingestion (use existing bill_texts from dossier ingestion)...", {
    legislature,
    dryRun: options.dryRun
  });

  // Load existing bill_texts (created by dossier ingestion): id, bill_id, texte_ref
  // and dossier official_id from bills view to build billTextIdByKey(dossierRef, texteRef) -> bill_texts.id
  const billOfficialIdById = new Map<string, string>();
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from("bills")
      .select("id, official_id")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Failed to fetch bills: ${error.message}`);
    if (!page?.length) break;
    for (const row of page as { id: string; official_id: string }[]) {
      if (row.official_id) billOfficialIdById.set(row.id, row.official_id);
    }
    if (page.length < PAGE) break;
    offset += PAGE;
  }

  const billTextIdByKey = new Map<string, string>();
  offset = 0;
  while (true) {
    const { data: textPage, error: selectError } = await supabase
      .from("bill_texts")
      .select("id, bill_id, texte_ref")
      .range(offset, offset + PAGE - 1);
    if (selectError) throw new Error(`Failed to select bill_texts: ${selectError.message}`);
    if (!textPage?.length) break;
    for (const row of textPage as { id: string; bill_id: string; texte_ref: string }[]) {
      const dossierRef = billOfficialIdById.get(row.bill_id);
      if (dossierRef) {
        const key = billTextMapKey(dossierRef, row.texte_ref);
        billTextIdByKey.set(key, row.id);
      }
    }
    if (textPage.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`Loaded ${billTextIdByKey.size} bill_text(s) from dossier ingestion.`);

  const items = await fetchAmendmentListForLegislature(legislature);
  const rows = mapAmendmentsToBillTexts(items, billTextIdByKey);
  console.log(`Amendments matching existing bill_texts: ${rows.length}`);

  if (options.dryRun) {
    const sample = rows.slice(0, 5);
    console.log("Dry run - would upsert amendments (sample):", sample);
    if (rows.length > 5) console.log(`... and ${rows.length - 5} more`);
    return { totalAmendments: 0 };
  }

  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH) as AmendmentInsert[];
    const { error } = await supabase.from("amendments").upsert(chunk, {
      onConflict: "bill_text_id,numero",
      ignoreDuplicates: false
    });
    if (error) {
      console.error(`Error upserting amendments batch at ${i}:`, error);
    } else {
      upserted += chunk.length;
      if ((i + BATCH) % 2000 < BATCH || i + BATCH >= rows.length) {
        console.log(`  Amendments upserted: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
      }
    }
  }

  console.log(`Amendments ingestion complete. Upserted: ${upserted}`);
  return { totalAmendments: upserted };
}
