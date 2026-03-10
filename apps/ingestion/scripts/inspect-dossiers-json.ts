/**
 * One-off: download Dossiers_Legislatifs ZIP and print full structure of first dossier JSON.
 * Run from apps/ingestion: npx ts-node scripts/inspect-dossiers-json.ts
 */

import { Readable } from "stream";
import unzipper from "unzipper";

const DOSSIERS_ZIP_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip";

function keysOf(obj: unknown): string[] {
  if (obj == null || typeof obj !== "object") return [];
  return Object.keys(obj as object);
}

async function main() {
  console.log("Downloading Dossiers_Legislatifs ZIP (leg 17)...");
  const response = await (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch(DOSSIERS_ZIP_URL);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log("ZIP size (MB):", (buffer.length / 1024 / 1024).toFixed(2));

  let firstDossier: Record<string, unknown> | null = null;
  let wrapperKeys: string[] = [];
  let fileCount = 0;
  const allTopLevelKeys = new Set<string>();
  const allTitreDossierKeys = new Set<string>();
  const allProcedureKeys = new Set<string>();
  let sampleWithInitiateur: Record<string, unknown> | null = null;
  let sampleProjetDeLoi: Record<string, unknown> | null = null;

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        const fileName = entry.path;
        if (
          fileName.endsWith(".json") &&
          fileName.includes("json/dossierParlementaire/") &&
          !fileName.includes("__")
        ) {
          fileCount++;
          try {
            const content = await entry.buffer();
            const data = JSON.parse(content.toString("utf-8")) as Record<string, unknown>;
            if (firstDossier === null) wrapperKeys = keysOf(data);
            const dp = data.dossierParlementaire ?? data.dossierparlementaire;
            if (dp && typeof dp === "object") {
              const d = dp as Record<string, unknown>;
              keysOf(d).forEach((k) => allTopLevelKeys.add(k));
              const titre = d.titreDossier as Record<string, unknown> | undefined;
              if (titre) keysOf(titre).forEach((k) => allTitreDossierKeys.add(k));
              const proc = d.procedureParlementaire as Record<string, unknown> | undefined;
              if (proc) keysOf(proc).forEach((k) => allProcedureKeys.add(k));
              if (firstDossier === null) firstDossier = d;
              if (d.initiateur != null && sampleWithInitiateur === null) sampleWithInitiateur = d;
              const lib = String(proc?.libelle ?? "").toLowerCase();
              if (lib.includes("projet de loi") && sampleProjetDeLoi === null) sampleProjetDeLoi = d;
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

  console.log("\nTotal JSON dossier files in ZIP:", fileCount);
  console.log("\n--- Wrapper top-level keys ---");
  console.log(wrapperKeys.sort().join(", "));
  console.log("\n--- All dossierParlementaire top-level keys (union over all files) ---");
  console.log([...allTopLevelKeys].sort().join(", "));
  console.log("\n--- All titreDossier keys (union) ---");
  console.log([...allTitreDossierKeys].sort().join(", "));
  console.log("\n--- All procedureParlementaire keys (union) ---");
  console.log([...allProcedureKeys].sort().join(", "));

  if (!firstDossier) {
    console.log("No dossierParlementaire found in first file.");
    return;
  }

  console.log("\n--- dossierParlementaire top-level keys (sorted) ---");
  const topKeys = keysOf(firstDossier).sort();
  console.log(topKeys.join(", "));

  console.log("\n--- Full structure (keys and sample values) ---");
  topKeys.forEach((k) => {
    const v = firstDossier![k];
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      const subKeys = keysOf(v).sort();
      console.log(`\n${k}: object with keys: ${subKeys.join(", ")}`);
      subKeys.forEach((sk) => {
        const sv = (v as Record<string, unknown>)[sk];
        if (sv != null && typeof sv === "object" && !Array.isArray(sv)) {
          const subSubKeys = keysOf(sv).sort();
          console.log(`  ${k}.${sk}: { ${subSubKeys.join(", ")} }`);
          subSubKeys.slice(0, 15).forEach((ssk) => {
            const ssv = (sv as Record<string, unknown>)[ssk];
            const preview =
              typeof ssv === "string"
                ? ssv.length > 50
                  ? ssv.slice(0, 50) + "..."
                  : ssv
                : Array.isArray(ssv)
                  ? `[${(ssv as unknown[]).length} items]`
                  : JSON.stringify(ssv);
            console.log(`    ${k}.${sk}.${ssk}: ${preview}`);
          });
          if (subSubKeys.length > 15) console.log(`    ... and ${subSubKeys.length - 15} more`);
        } else {
          const preview =
            typeof sv === "string"
              ? sv.length > 70
                ? sv.slice(0, 70) + "..."
                : sv
              : Array.isArray(sv)
                ? `array[${(sv as unknown[]).length}]`
                : String(sv);
          console.log(`  ${k}.${sk}: ${preview}`);
        }
      });
    } else {
      const preview =
        typeof v === "string"
          ? v.length > 80
            ? v.slice(0, 80) + "..."
            : v
          : Array.isArray(v)
            ? `array[${(v as unknown[]).length}]`
            : String(v);
      console.log(`\n${k}: ${preview}`);
    }
  });

  const withInit = sampleWithInitiateur as Record<string, unknown> | null;
  if (withInit != null && withInit.initiateur != null) {
    console.log("\n--- Sample dossier with initiateur ---");
    const init = withInit.initiateur as Record<string, unknown>;
    console.log("initiateur keys:", keysOf(init).sort().join(", "));
    keysOf(init).forEach((k) => {
      const v = init[k];
      console.log(`  initiateur.${k}:`, typeof v === "object" ? JSON.stringify(v).slice(0, 120) : v);
    });
  }
  if (sampleProjetDeLoi) {
    console.log("\n--- Sample projet de loi: top-level keys ---");
    console.log(keysOf(sampleProjetDeLoi).sort().join(", "));
    ["classification", "dateDepot", "fusionDossier", "initiateur"].forEach((k) => {
      const v = (sampleProjetDeLoi as Record<string, unknown>)[k];
      if (v != null) console.log(`  ${k}:`, typeof v === "object" ? JSON.stringify(v).slice(0, 150) : v);
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
