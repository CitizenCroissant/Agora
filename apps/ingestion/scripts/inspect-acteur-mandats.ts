/**
 * Inspect raw mandats for an acteur (e.g. PA722190) from AMO data.
 * Run: npx ts-node scripts/inspect-acteur-mandats.ts PA722190
 */
import { deputiesClient } from "../src/deputies-client";
import { transformDeputy } from "../src/deputies-transform";

function toList<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

async function main() {
  const acteurRef = process.argv[2] || "PA722190";
  console.log(`Fetching deputies and looking for ${acteurRef}...\n`);

  const all = await deputiesClient.fetchAllDeputies();
  const item = all.find(
    (d) =>
      (typeof d.acteur.uid === "string" && d.acteur.uid.trim() === acteurRef) ||
      (d.acteur.uid &&
        typeof d.acteur.uid === "object" &&
        "#text" in d.acteur.uid &&
        (d.acteur.uid as { "#text"?: string })["#text"] === acteurRef)
  );

  if (!item) {
    console.log(`Acteur ${acteurRef} not found in AMO data.`);
    return;
  }

  const mandats = toList(item.acteur.mandats?.mandat);
  console.log(`Found ${acteurRef}, ${mandats.length} mandat(s).\n`);
  console.log("Raw mandats (election / lieu / refCirconscription):");
  mandats.forEach((m, i) => {
    const el = m.election;
    console.log(
      `  [${i}] typeOrgane=${m.typeOrgane} dateDebut=${m.dateDebut} dateFin=${m.dateFin}`
    );
    console.log(
      `      election.lieu=${el?.lieu ? JSON.stringify(el.lieu) : "null"}`
    );
    console.log(
      `      election.refCirconscription=${el?.refCirconscription ?? "null"}`
    );
    console.log(
      `      infosQualite=${m.infosQualite?.libelleQualiteSex ?? "null"}`
    );
  });

  const transformed = transformDeputy(item);
  console.log("\nTransformed deputy:");
  console.log(
    JSON.stringify(
      {
        acteur_ref: transformed?.acteur_ref,
        civil_nom: transformed?.civil_nom,
        civil_prenom: transformed?.civil_prenom,
        circonscription: transformed?.circonscription,
        departement: transformed?.departement,
        groupe_politique: transformed?.groupe_politique
      },
      null,
      2
    )
  );
}

main().catch(console.error);
