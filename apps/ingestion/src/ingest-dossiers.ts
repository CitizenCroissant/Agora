/**
 * Ingest legislative dossiers (dossiers législatifs) from Assemblée nationale open data.
 * Uses the official Dossiers_Legislatifs.json.zip dataset (legislature 17).
 *
 * This populates the `bills` table with one row per dossierParlementaire.
 * For now we do not create bill_scrutins links here, as the dataset does not
 * directly enumerate scrutins; those links can be filled by a separate process.
 */

import { supabase } from "./supabase";
import { dossiersClient } from "./dossiers-client";
import { AssembleeDossierParlementaire } from "./dossiers-types";

export interface IngestDossiersOptions {
  dryRun?: boolean;
  /** Legislature to ingest: "17", "16", or "all". Default "17" (cron uses this). */
  legislature?: string;
}

function inferTypeAndOrigin(dossier: AssembleeDossierParlementaire): {
  type: string | null;
  origin: string | null;
} {
  const libelle =
    dossier.procedureParlementaire?.libelle ??
    dossier.titreDossier?.titre ??
    "";
  const lower = libelle.toLowerCase();

  if (lower.includes("projet de loi")) {
    return { type: "projet_de_loi", origin: "gouvernement" };
  }
  if (lower.includes("proposition de loi")) {
    return { type: "proposition_de_loi", origin: "parlementaire" };
  }
  if (lower.includes("résolution")) {
    return { type: "resolution", origin: null };
  }

  return { type: null, origin: null };
}

function buildOfficialUrl(dossier: AssembleeDossierParlementaire): string | null {
  const chemin = dossier.titreDossier?.titreChemin;
  if (!chemin) return null;
  const leg = dossier.legislature ?? "17";
  return `https://www.assemblee-nationale.fr/dyn/${leg}/dossiers/${chemin}`;
}

export async function ingestDossiers(
  options: IngestDossiersOptions = {},
): Promise<{ totalDossiers: number }> {
  const legislature = options.legislature ?? "17";
  console.log("Starting dossiers ingestion...", { ...options, legislature });

  const all = await dossiersClient.fetchAllDossiers(legislature);
  const dossiers =
    legislature === "all"
      ? all
      : all.filter((d) => String(d.legislature ?? "") === legislature);

  console.log(
    `Found ${dossiers.length} dossier(s) for legislature ${legislature}`,
  );

  let upserted = 0;

  for (const dossier of dossiers) {
    const uid = dossier.uid;
    const title = dossier.titreDossier?.titre?.trim();
    if (!uid || !title) {
      continue;
    }

    const { type, origin } = inferTypeAndOrigin(dossier);
    const officialUrl = buildOfficialUrl(dossier);
    const shortTitle = title.length > 160 ? `${title.slice(0, 157)}…` : title;

    if (options.dryRun) {
      console.log("Dry run - would upsert bill:", {
        official_id: uid,
        title,
        type,
        origin,
      });
      continue;
    }

    const { error } = await supabase.from("bills").upsert(
      {
        official_id: uid,
        title,
        short_title: shortTitle,
        type,
        origin,
        official_url: officialUrl,
      },
      {
        onConflict: "official_id",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      console.error("Error upserting bill (dossier)", uid, error);
    } else {
      upserted++;
    }
  }

  console.log(`Dossiers ingestion complete. Bills upserted: ${upserted}`);

  return { totalDossiers: upserted };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: IngestDossiersOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--legislature" && args[i + 1]) {
      options.legislature = args[i + 1];
      i++;
    }
  }

  ingestDossiers(options).catch((error) => {
    console.error("Fatal error (dossiers ingestion):", error);
    process.exit(1);
  });
}

