/**
 * CLI script to tag a single bill by ID
 * Usage: npm run tag:single-bill -- <bill-id>
 */

import { supabase } from "./supabase";
import { tagBill } from "./tag-bills";

async function tagSingleBill() {
  const billId = process.argv[2];

  if (!billId) {
    console.error("Usage: npm run tag:single-bill -- <bill-id>");
    process.exit(1);
  }

  console.log(`Looking up bill ${billId}...`);

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, title, short_title, official_id")
    .eq("id", billId)
    .maybeSingle();

  if (billError) {
    console.error("Error fetching bill:", billError);
    process.exit(1);
  }

  if (!bill) {
    console.error(`Bill not found: ${billId}`);
    process.exit(1);
  }

  console.log(`Bill: ${bill.title}`);
  console.log(`Official ID: ${bill.official_id}`);

  await tagBill(bill.id, bill.title, bill.short_title);

  // Show resulting tags
  const { data: tags } = await supabase
    .from("bill_thematic_tags")
    .select("tag_id, confidence, source")
    .eq("bill_id", bill.id);

  if (tags && tags.length > 0) {
    const tagIds = tags.map((t) => t.tag_id);
    const { data: tagDetails } = await supabase
      .from("thematic_tags")
      .select("id, slug, label")
      .in("id", tagIds);

    console.log(`\nTags (${tags.length}):`);
    for (const t of tags) {
      const detail = (tagDetails || []).find(
        (td: { id: string }) => td.id === t.tag_id
      );
      console.log(
        `  - ${detail?.label ?? t.tag_id} (confidence: ${t.confidence}, source: ${t.source})`
      );
    }
  } else {
    console.log("\nNo tags matched for this bill.");
  }
}

tagSingleBill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
