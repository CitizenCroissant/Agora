/**
 * CLI script to tag all existing scrutins that don't have tags yet
 * Usage: npm run tag:all-scrutins
 */

import { supabase } from "./supabase";
import { tagScrutin } from "./tag-scrutins";

async function tagAllScrutins() {
  console.log("Fetching all scrutins...");

  // Get all scrutins
  const { data: scrutins, error: scrutinsError } = await supabase
    .from("scrutins")
    .select("id, titre, official_id");

  if (scrutinsError) {
    console.error("Error fetching scrutins:", scrutinsError);
    process.exit(1);
  }

  if (!scrutins || scrutins.length === 0) {
    console.log("No scrutins found.");
    return;
  }

  console.log(`Found ${scrutins.length} scrutin(s)`);

  // Get scrutins that already have tags
  const { data: taggedScrutins } = await supabase
    .from("scrutin_thematic_tags")
    .select("scrutin_id");

  const taggedIds = new Set(
    (taggedScrutins || []).map((st) => st.scrutin_id),
  );

  // Filter out already tagged scrutins
  const untaggedScrutins = scrutins.filter((s) => !taggedIds.has(s.id));

  console.log(
    `${taggedIds.size} already tagged, ${untaggedScrutins.length} need tagging`,
  );

  if (untaggedScrutins.length === 0) {
    console.log("All scrutins are already tagged!");
    return;
  }

  // Fetch the full scrutin data including objet.libelle from the original source
  // For now, we'll use just the titre since we don't have easy access to objet.libelle
  // In a real scenario, you might want to fetch from the original API or store it
  let tagged = 0;
  let errors = 0;

  for (const scrutin of untaggedScrutins) {
    try {
      // Tag using only titre (objet.libelle not available in DB)
      await tagScrutin(scrutin.id, scrutin.titre, null);
      tagged++;
      if (tagged % 10 === 0) {
        console.log(`Tagged ${tagged}/${untaggedScrutins.length}...`);
      }
    } catch (error) {
      console.error(
        `Error tagging scrutin ${scrutin.id} (${scrutin.official_id}):`,
        error instanceof Error ? error.message : error,
      );
      errors++;
    }
  }

  console.log(
    `\nDone! Tagged ${tagged} scrutin(s), ${errors} error(s)`,
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
