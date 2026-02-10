/**
 * Client for Assemblée nationale Dossiers législatifs open data.
 * Fetches Dossiers_Legislatifs.json.zip and parses dossier JSON files.
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import {
  AssembleeDossierWrapper,
  AssembleeDossierParlementaire,
} from "./dossiers-types";

const DOSSIERS_ZIP_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip";

export class DossiersClient {
  private cachedDossiers: AssembleeDossierParlementaire[] | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch all dossiersParlementaires from the ZIP archive.
   */
  async fetchAllDossiers(): Promise<AssembleeDossierParlementaire[]> {
    if (
      this.cacheExpiry &&
      new Date() < this.cacheExpiry &&
      this.cachedDossiers
    ) {
      return this.cachedDossiers;
    }

    console.log("Downloading Dossiers_Legislatifs from Assemblée nationale...");
    // Use the global fetch provided by the Node.js runtime.
    const response = await (globalThis as any).fetch(DOSSIERS_ZIP_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to download Dossiers_Legislatifs: ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dossiers: AssembleeDossierParlementaire[] = [];

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
                content.toString("utf-8"),
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

    console.log(`Loaded ${dossiers.length} dossiers from archive`);
    this.cachedDossiers = dossiers;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION_MS);
    return dossiers;
  }
}

export const dossiersClient = new DossiersClient();

