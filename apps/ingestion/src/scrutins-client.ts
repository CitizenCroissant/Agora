/**
 * Client for Assemblée nationale Scrutins open data
 * Fetches Scrutins.json.zip and parses scrutin JSON files
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import { ScrutinWrapper, AssembleeScrutin } from "./scrutins-types";

const SCRUTINS_ZIP_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip";

export class ScrutinsClient {
  private cachedScrutins: AssembleeScrutin[] | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Fetch all scrutins from the ZIP archive
   */
  async fetchAllScrutins(): Promise<AssembleeScrutin[]> {
    if (
      this.cacheExpiry &&
      new Date() < this.cacheExpiry &&
      this.cachedScrutins
    ) {
      return this.cachedScrutins;
    }

    console.log("Downloading scrutins from Assemblée nationale...");
    // Use the global fetch provided by the Node.js runtime, avoiding ESM-only node-fetch.
    const response = await (globalThis as any).fetch(SCRUTINS_ZIP_URL);

    if (!response.ok) {
      throw new Error(`Failed to download scrutins: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const scrutins: AssembleeScrutin[] = [];

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
              const data: ScrutinWrapper = JSON.parse(
                content.toString("utf-8"),
              );
              if (data.scrutin) {
                scrutins.push(data.scrutin);
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

    console.log(`Loaded ${scrutins.length} scrutins from archive`);
    this.cachedScrutins = scrutins;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION_MS);
    return scrutins;
  }

  /**
   * Fetch scrutins for a date range
   */
  async fetchScrutinsByDateRange(
    from: string,
    to: string,
  ): Promise<AssembleeScrutin[]> {
    const all = await this.fetchAllScrutins();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return all.filter((s) => {
      const d = s.dateScrutin ? new Date(s.dateScrutin) : null;
      if (!d || isNaN(d.getTime())) return false;
      return d >= fromDate && d <= toDate;
    });
  }
}

export const scrutinsClient = new ScrutinsClient();
