/**
 * CLI script to tag all existing bills that don't have tags yet.
 * Uses batch mode: keyword matching is done in-memory, then all DB writes
 * are batched into chunked upserts (~40-50 requests total instead of ~25,000).
 *
 * Usage: npm run tag:all-bills
 *        npm run tag:all-bills -- --force   # re-tag all bills (including already tagged)
 */

import { supabase } from "./supabase";
import {
  getThematicTags,
  matchBillTags,
  batchDeleteBillTags,
  batchUpsertBillTags,
} from "./tag-bills";

const PAGE_SIZE = 1000;

async function fetchAllBills(): Promise<
  Array<{ id: string; title: string; short_title: string | null; official_id: string }>
> {
  const allBills: Array<{
    id: string;
    title: string;
    short_title: string | null;
    official_id: string;
  }> = [];

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("bills")
      .select("id, title, short_title, official_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching bills:", error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allBills.push(...data);
    if (allBills.length % 5000 === 0 || data.length < PAGE_SIZE) {
      console.log(`  Fetched ${allBills.length} bills...`);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allBills;
}

async function fetchTaggedBillIds(): Promise<Set<string>> {
  const taggedIds = new Set<string>();
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("bill_thematic_tags")
      .select("bill_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching tagged bill ids:", error);
      break;
    }
    if (!data || data.length === 0) break;
    for (const row of data) taggedIds.add(row.bill_id);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return taggedIds;
}

async function tagAllBills() {
  const force = process.argv.includes("--force");
  const startTime = Date.now();

  console.log("Fetching all bills (paginated)...");
  const bills = await fetchAllBills();

  if (bills.length === 0) {
    console.log("No bills found.");
    return;
  }
  console.log(`Found ${bills.length} bill(s)`);

  // Determine which bills to process
  let billsToTag = bills;
  if (!force) {
    const taggedIds = await fetchTaggedBillIds();
    billsToTag = bills.filter((b) => !taggedIds.has(b.id));
    console.log(
      `${taggedIds.size} already tagged, ${billsToTag.length} need tagging`,
    );
  } else {
    console.log("--force: re-tagging all bills");
  }

  if (billsToTag.length === 0) {
    console.log("All bills are already tagged!");
    return;
  }

  // 1. Fetch thematic tags once
  const tags = await getThematicTags();
  if (!tags || tags.length === 0) {
    console.error("No thematic tags found in database.");
    process.exit(1);
  }
  console.log(`Loaded ${tags.length} thematic tag(s)\n`);

  // 2. In-memory keyword matching (fast, no DB calls)
  console.log("Matching keywords in memory...");
  const allRows: Array<{
    bill_id: string;
    tag_id: string;
    source: string;
    confidence: number;
  }> = [];
  let matched = 0;

  for (const bill of billsToTag) {
    const rows = matchBillTags(bill.id, bill.title, bill.short_title, tags);
    if (rows.length > 0) {
      allRows.push(...rows);
      matched++;
    }
  }

  console.log(
    `  ${matched} bill(s) matched at least one tag (${allRows.length} tag links total)`,
  );

  if (allRows.length === 0) {
    console.log("No tags to write.");
    return;
  }

  // 3. Batch delete existing tags for bills we're about to re-tag
  const billIdsToDelete = [...new Set(allRows.map((r) => r.bill_id))];
  console.log(`\nBatch-deleting old tags for ${billIdsToDelete.length} bill(s)...`);
  await batchDeleteBillTags(billIdsToDelete);

  // 4. Batch upsert all new tags
  console.log(`Batch-inserting ${allRows.length} tag link(s)...`);
  const { inserted, errors } = await batchUpsertBillTags(allRows);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s! ${inserted} tag link(s) written, ${errors} error(s).`,
  );
  console.log(
    `${matched}/${billsToTag.length} bill(s) got at least one tag.`,
  );
}

tagAllBills()
  .then(() => {
    console.log("Tagging complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
