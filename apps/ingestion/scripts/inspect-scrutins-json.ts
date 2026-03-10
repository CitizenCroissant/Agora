/**
 * One-off: download Scrutins ZIP and print actual JSON keys for objet/demandeur/dossier refs.
 * Run: npx ts-node scripts/inspect-scrutins-json.ts
 */

import { Readable } from "stream";
import unzipper from "unzipper";

const SCRUTINS_ZIP_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip";

function keysOf(obj: unknown): string[] {
  if (obj == null || typeof obj !== "object") return [];
  return Object.keys(obj as object);
}

function isAmendmentLike(s: Record<string, unknown>): boolean {
  const titre = String(s.titre ?? s.Titre ?? "").toLowerCase();
  const objet = (s.objet ?? s.Objet) as Record<string, unknown> | undefined;
  const objLibelle = objet && typeof objet === "object" ? String(objet.libelle ?? objet.Libelle ?? "").toLowerCase() : "";
  return titre.includes("amendement") || objLibelle.includes("amendement");
}

async function main() {
  console.log("Downloading Scrutins ZIP...");
  const response = await (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch(SCRUTINS_ZIP_URL);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log("ZIP size (MB):", (buffer.length / 1024 / 1024).toFixed(2));

  const scrutins: Record<string, unknown>[] = [];
  let amendmentSample: Record<string, unknown> | null = null;
  type S = Record<string, unknown>;

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        const fileName = entry.path;
        if (
          fileName.endsWith(".json") &&
          fileName.includes("json/") &&
          !fileName.includes("__")
        ) {
          try {
            const content = await entry.buffer();
            const data = JSON.parse(content.toString("utf-8")) as { scrutin?: Record<string, unknown> };
            if (data.scrutin) {
              scrutins.push(data.scrutin);
              if (!amendmentSample && isAmendmentLike(data.scrutin)) {
                amendmentSample = data.scrutin;
              }
            }
          } catch {
            // skip
          }
        }
        entry.autodrain();
      })
      .on("error", reject)
      .on("close", resolve);
  });

  console.log("\nTotal scrutins in ZIP:", scrutins.length);

  // Top-level keys (from first 3 scrutins)
  const topLevelKeys = new Set<string>();
  for (let i = 0; i < Math.min(3, scrutins.length); i++) {
    keysOf(scrutins[i]).forEach((k) => topLevelKeys.add(k));
  }
  console.log("\n--- Top-level keys (first 3 scrutins) ---");
  console.log([...topLevelKeys].sort().join(", "));

  // objet keys and values (first scrutin that has objet)
  for (const s of scrutins as S[]) {
    const objet = s.objet ?? s.Objet;
    if (objet && typeof objet === "object") {
      const obj = objet as Record<string, unknown>;
      console.log("\n--- objet keys (first scrutin with objet) ---");
      console.log(keysOf(obj).sort().join(", "));
      for (const k of keysOf(obj).sort()) {
        const v = obj[k];
        const preview = typeof v === "string" ? (v.length > 80 ? v.slice(0, 80) + "..." : v) : JSON.stringify(v);
        console.log(`  ${k}: ${preview}`);
      }
      break;
    }
  }

  // demandeur keys (first scrutin with demandeur)
  for (const s of scrutins as S[]) {
    const demandeur = s.demandeur ?? s.Demandeur;
    if (demandeur && typeof demandeur === "object") {
      const d = demandeur as Record<string, unknown>;
      console.log("\n--- demandeur keys (first scrutin with demandeur) ---");
      console.log(keysOf(d).sort().join(", "));
      for (const k of keysOf(d).sort()) {
        const v = d[k];
        const preview = typeof v === "string" ? (v.length > 80 ? v.slice(0, 80) + "..." : v) : JSON.stringify(v);
        console.log(`  ${k}: ${preview}`);
      }
      break;
    }
  }

  // Amendment sample: full objet and demandeur
  const amendment = amendmentSample as Record<string, unknown> | null;
  if (amendment) {
    console.log("\n--- Amendment sample: top-level keys ---");
    console.log(keysOf(amendment).sort().join(", "));
    const objet = (amendment.objet ?? amendment.Objet) as Record<string, unknown> | undefined;
    if (objet) {
      console.log("\n--- Amendment sample: objet (all keys and values) ---");
      for (const k of keysOf(objet).sort()) {
        const v = objet[k];
        const preview = typeof v === "string" ? (v.length > 120 ? v.slice(0, 120) + "..." : v) : JSON.stringify(v);
        console.log(`  ${k}: ${preview}`);
      }
    }
    const demandeur = (amendment.demandeur ?? amendment.Demandeur) as Record<string, unknown> | undefined;
    if (demandeur) {
      console.log("\n--- Amendment sample: demandeur (all keys and values) ---");
      for (const k of keysOf(demandeur).sort()) {
        const v = demandeur[k];
        const preview = typeof v === "string" ? (v.length > 120 ? v.slice(0, 120) + "..." : v) : JSON.stringify(v);
        console.log(`  ${k}: ${preview}`);
      }
    }
  }

  // Count how many have objet.dossierLegislatif vs Objet.DossierLegislatif vs other
  let hasObjetDossierLegislatif = 0;
  let hasObjetDossierRef = 0;
  let hasObjetRef = 0;
  let hasObjetAtAll = 0;
  for (const s of scrutins as S[]) {
    const objet = (s.objet ?? s.Objet) as Record<string, unknown> | undefined;
    if (!objet || typeof objet !== "object") continue;
    hasObjetAtAll++;
    if (objet.dossierLegislatif != null && String(objet.dossierLegislatif).trim()) hasObjetDossierLegislatif++;
    if (objet.DossierLegislatif != null && String(objet.DossierLegislatif).trim()) hasObjetDossierLegislatif++;
    if (objet.dossierRef != null && String(objet.dossierRef).trim()) hasObjetDossierRef++;
    if (objet.referenceLegislative != null || objet.ReferenceLegislative != null) hasObjetRef++;
  }
  console.log("\n--- Counts ---");
  console.log("With objet: ", hasObjetAtAll);
  console.log("With objet.dossierLegislatif or DossierLegislatif (non-empty): ", hasObjetDossierLegislatif);
  console.log("With objet.dossierRef (non-empty): ", hasObjetDossierRef);
  console.log("With objet.referenceLegislative or ReferenceLegislative: ", hasObjetRef);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
