/**
 * Quick script to check deputies table - run with: npx ts-node scripts/check-deputies.ts
 */
import { supabase } from "../src/supabase";

async function main() {
  // Count total deputies
  const { count, error: countErr } = await supabase
    .from("deputies")
    .select("*", { count: "exact", head: true });
  console.log(
    "Total deputies:",
    count,
    countErr ? `(error: ${countErr.message})` : ""
  );

  // Check PA267042 specifically
  const { data: deputy, error } = await supabase
    .from("deputies")
    .select("*")
    .eq("acteur_ref", "PA267042")
    .maybeSingle();
  console.log(
    "\nPA267042:",
    deputy ?? "NOT FOUND",
    error ? `(error: ${error.message})` : ""
  );

  // Sample acteur_refs that start with PA267
  const { data: similar } = await supabase
    .from("deputies")
    .select("acteur_ref, civil_nom, civil_prenom")
    .ilike("acteur_ref", "PA267%")
    .limit(10);
  console.log("\nSample acteur_refs like PA267%:", similar ?? []);

  // Sample of acteur_ref format (first 5)
  const { data: sample } = await supabase
    .from("deputies")
    .select("acteur_ref, civil_nom, civil_prenom")
    .limit(5);
  console.log("\nSample acteur_refs:", sample ?? []);

  // Check scrutin_votes for PA267042
  const { data: votes, count: voteCount } = await supabase
    .from("scrutin_votes")
    .select("acteur_ref, scrutin_id", { count: "exact" })
    .eq("acteur_ref", "PA267042")
    .limit(1);
  console.log(
    "\nPA267042 in scrutin_votes:",
    voteCount ?? 0,
    "vote(s)",
    votes ?? []
  );
}

main().catch(console.error);
