/**
 * Client for Assemblée nationale Dossiers législatifs open data.
 * Fetches Dossiers_Legislatifs.json.zip per legislature and parses dossier JSON files.
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import {
  AssembleeDossierWrapper,
  AssembleeDossierParlementaire,
  DossiersXIVExport,
  DossiersXIVDocument
} from "./dossiers-types";

/**
 * Legislatures for which we attempt to fetch dossiers when legislature is "all".
 * Verified 2026-02 on data.assemblee-nationale.fr:
 * - 14, 15: use Roman-numeral filename (Dossiers_Legislatifs_XIV.json.zip, _XV.json.zip).
 * - 16, 17: use Dossiers_Legislatifs.json.zip.
 * - 0–13: no dossiers ZIP at that repository path (404).
 */
export const LEGISLATURES_WITH_DOSSIERS = ["14", "15", "16", "17"] as const;

/** Roman numeral suffix for dossiers ZIP (14 and 15 use it; 16 and 17 use the default name). */
const ROMAN_BY_LEG: Record<string, string> = {
  "14": "XIV",
  "15": "XV"
};

function zipFilenameForLegislature(legislature: string): string {
  const roman = ROMAN_BY_LEG[legislature];
  return roman
    ? `Dossiers_Legislatifs_${roman}.json.zip`
    : "Dossiers_Legislatifs.json.zip";
}

function zipUrlForLegislature(legislature: string): string {
  const base =
    "https://data.assemblee-nationale.fr/static/openData/repository";
  const filename = zipFilenameForLegislature(legislature);
  return `${base}/${legislature}/loi/dossiers_legislatifs/${filename}`;
}

/** Legislature 14 ZIP contains a single JSON file; parse it and return one dossier per unique dossierRef. */
function parseXIVSingleJson(
  buffer: Buffer,
  legislature: string
): Promise<AssembleeDossierParlementaire[]> {
  let rawJson: string | null = null;

  return new Promise<AssembleeDossierParlementaire[]>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        const fileName = entry.path;
        if (fileName.endsWith(".json") && !fileName.includes("__")) {
          const content = await entry.buffer();
          rawJson = content.toString("utf-8");
        }
        entry.autodrain();
      })
      .on("error", reject)
      .on("close", () => {
        if (!rawJson) {
          resolve([]);
          return;
        }
        try {
          const data = JSON.parse(rawJson) as DossiersXIVExport;
          const doc =
            data?.export?.textesLegislatifs?.document ??
            ([] as DossiersXIVDocument[]);
          const list = Array.isArray(doc) ? doc : [doc];
          const byRef = new Map<
            string,
            { titre: string; libelle: string | null }
          >();
          for (const d of list) {
            const ref = d.dossierRef?.trim();
            if (!ref) continue;
            const titre =
              d.titres?.titrePrincipal?.trim() ??
              d.titres?.titrePrincipalCourt?.trim() ??
              d.denominationStructurelle?.trim() ??
              "";
            const libelle =
              d.denominationStructurelle ??
              d.classification?.type?.libelle ??
              null;
            if (!byRef.has(ref) || (titre && !byRef.get(ref)!.titre))
              byRef.set(ref, { titre: titre || "Sans titre", libelle });
          }
          const result: AssembleeDossierParlementaire[] = [];
          for (const [uid, { titre, libelle }] of byRef.entries()) {
            result.push({
              uid,
              legislature,
              titreDossier: { titre },
              procedureParlementaire: libelle ? { libelle } : undefined
            });
          }
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
  });
}

export class DossiersClient {
  private cacheByLegislature = new Map<
    string,
    { dossiers: AssembleeDossierParlementaire[]; expiry: Date }
  >();
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch all dossiers from the ZIP archive for one legislature.
   */
  async fetchDossiersForLegislature(
    legislature: string
  ): Promise<AssembleeDossierParlementaire[]> {
    const cached = this.cacheByLegislature.get(legislature);
    if (cached && new Date() < cached.expiry) {
      return cached.dossiers;
    }

    const url = zipUrlForLegislature(legislature);
    console.log(
      `Downloading Dossiers_Legislatifs for legislature ${legislature}...`
    );
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to download Dossiers_Legislatifs (legislature ${legislature}): ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let dossiers: AssembleeDossierParlementaire[];
    if (legislature === "14") {
      dossiers = await parseXIVSingleJson(buffer, legislature);
    } else {
      dossiers = [];
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
              try {
                const content = await entry.buffer();
                const data: AssembleeDossierWrapper = JSON.parse(
                  content.toString("utf-8")
                );
                if (data.dossierParlementaire) {
                  dossiers.push(data.dossierParlementaire);
                }
              } catch (error) {
                console.error(`Error parsing ${fileName}:`, error);
              }
            } else {
              entry.autodrain();
            }
          })
          .on("error", reject)
          .on("close", resolve);
      });
    }

    console.log(
      `Loaded ${dossiers.length} dossiers from archive (legislature ${legislature})`
    );
    this.cacheByLegislature.set(legislature, {
      dossiers,
      expiry: new Date(Date.now() + this.CACHE_DURATION_MS)
    });
    return dossiers;
  }

  /**
   * Fetch dossiers for one legislature or all supported legislatures.
   * @param legislature - "17", "16", or "all" (uses LEGISLATURES_WITH_DOSSIERS)
   */
  async fetchAllDossiers(
    legislature: string = "17"
  ): Promise<AssembleeDossierParlementaire[]> {
    if (legislature === "all") {
      const all: AssembleeDossierParlementaire[] = [];
      for (const leg of LEGISLATURES_WITH_DOSSIERS) {
        try {
          const dossiers = await this.fetchDossiersForLegislature(leg);
          all.push(...dossiers);
        } catch (err) {
          console.warn(
            `Skipping legislature ${leg} (${err instanceof Error ? err.message : err})`
          );
        }
      }
      console.log(`Total dossiers across all legislatures: ${all.length}`);
      return all;
    }
    return this.fetchDossiersForLegislature(legislature);
  }
}

export const dossiersClient = new DossiersClient();

