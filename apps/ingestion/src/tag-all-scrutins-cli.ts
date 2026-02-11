/**
 * CLI script to tag all existing scrutins that don't have tags yet.
 * Uses batch mode: keyword matching in-memory, then chunked DB writes.
 *
 * Usage: npm run tag:all-scrutins
 *        npm run tag:all-scrutins -- --force   # re-tag all (including already tagged)
 */

import { supabase } from "./supabase";
import {
  getScrutinThematicTags,
  matchScrutinTags,
  batchDeleteScrutinTags,
  batchUpsertScrutinTags,
} from "./tag-scrutins";

const PAGE_SIZE = 1000;

async function fetchAllScrutins(): Promise<
  Array<{ id: string; titre: string; official_id: string }>
> {
  const all: Array<{ id: string; titre: string; official_id: string }> = [];

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("scrutins")
      .select("id, titre, official_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching scrutins:", error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    all.push(...data);
    if (all.length % 5000 === 0 || data.length < PAGE_SIZE) {
      console.log(`  Fetched ${all.length} scrutins...`);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

async function fetchTaggedScrutinIds(): Promise<Set<string>> {
  const taggedIds = new Set<string>();
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("scrutin_thematic_tags")
      .select("scrutin_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching tagged scrutin ids:", error);
      break;
    }
    if (!data || data.length === 0) break;
    for (const row of data) taggedIds.add(row.scrutin_id);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return taggedIds;
}

async function tagAllScrutins() {
  const force = process.argv.includes("--force");
  const startTime = Date.now();

  console.log("Fetching all scrutins (paginated)...");
  const scrutins = await fetchAllScrutins();

  if (scrutins.length === 0) {
    console.log("No scrutins found.");
    return;
  }
  console.log(`Found ${scrutins.length} scrutin(s)`);

  // Determine which scrutins to process
  let toTag = scrutins;
  if (!force) {
    const taggedIds = await fetchTaggedScrutinIds();
    toTag = scrutins.filter((s) => !taggedIds.has(s.id));
    console.log(
      `${taggedIds.size} already tagged, ${toTag.length} need tagging`,
    );
  } else {
    console.log("--force: re-tagging all scrutins");
  }

  if (toTag.length === 0) {
    console.log("All scrutins are already tagged!");
    return;
  }

  // 1. Fetch thematic tags once
  const tags = await getScrutinThematicTags();
  if (!tags || tags.length === 0) {
    console.error("No thematic tags found in database.");
    process.exit(1);
  }
  console.log(`Loaded ${tags.length} thematic tag(s)\n`);

  // 2. In-memory keyword matching (fast, no DB calls)
  console.log("Matching keywords in memory...");
  const allRows: Array<{
    scrutin_id: string;
    tag_id: string;
    source: string;
    confidence: number;
  }> = [];
  let matched = 0;

  for (const scrutin of toTag) {
    const rows = matchScrutinTags(scrutin.id, scrutin.titre, null, tags);
    if (rows.length > 0) {
      allRows.push(...rows);
      matched++;
    }
  }

  console.log(
    `  ${matched} scrutin(s) matched at least one tag (${allRows.length} tag links total)`,
  );

  if (allRows.length === 0) {
    console.log("No tags to write.");
    return;
  }

  // 3. Batch delete existing tags for scrutins we're about to re-tag
  const idsToDelete = [...new Set(allRows.map((r) => r.scrutin_id))];
  console.log(
    `\nBatch-deleting old tags for ${idsToDelete.length} scrutin(s)...`,
  );
  await batchDeleteScrutinTags(idsToDelete);

  // 4. Batch upsert all new tags
  console.log(`Batch-inserting ${allRows.length} tag link(s)...`);
  const { inserted, errors } = await batchUpsertScrutinTags(allRows);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s! ${inserted} tag link(s) written, ${errors} error(s).`,
  );
  console.log(
    `${matched}/${toTag.length} scrutin(s) got at least one tag.`,
  );
}

tagAllScrutins()
  .then(() => {
    console.log("Tagging complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
