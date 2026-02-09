/**
 * CLI script to tag a single scrutin by ID
 * Usage: npm run tag:single-scrutin -- <scrutin-id>
 */

import { supabase } from "./supabase";
import { tagScrutin } from "./tag-scrutins";

const scrutinId = process.argv[2];

if (!scrutinId) {
  console.error("Usage: npm run tag:single-scrutin -- <scrutin-id>");
  process.exit(1);
}

async function tagSingleScrutin() {
  console.log(`Fetching scrutin ${scrutinId}...`);

  const { data: scrutin, error: scrutError } = await supabase
    .from("scrutins")
    .select("id, titre, official_id")
    .eq("id", scrutinId)
    .single();

  if (scrutError || !scrutin) {
    console.error("Error fetching scrutin:", scrutError);
    process.exit(1);
  }

  console.log(`Found scrutin: ${scrutin.titre}`);
  console.log("Tagging...");

  try {
    await tagScrutin(scrutin.id, scrutin.titre, null);
    console.log("Tagging complete!");
  } catch (error) {
    console.error("Error tagging:", error);
    process.exit(1);
  }
}

tagSingleScrutin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
