/**
 * Client for Assemblée nationale deputies (acteurs) open data
 * Uses AMO30 (historique) for all deputies since 11th legislature (1997)
 * to cover both current and former deputies who appear in scrutin votes.
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import { AssembleeActeur, AssembleeOrgane } from "./deputies-types";

const AMO_DEPUTIES_ZIP_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip";

export interface DeputyWithOrganes {
  acteur: AssembleeActeur;
  organesMap: Map<string, AssembleeOrgane>;
}

function toList<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/** Extract UID string - AMO30 has uid as { "#text": "PA123" }, AMO10 has plain string */
function extractUid(uid: unknown): string | null {
  if (typeof uid === "string" && uid.trim()) return uid.trim();
  if (uid && typeof uid === "object" && "#text" in uid) {
    const t = (uid as { "#text"?: unknown })["#text"];
    return typeof t === "string" && t.trim() ? t.trim() : null;
  }
  return null;
}

export class DeputiesClient {
  private cachedActeurs: DeputyWithOrganes[] | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

  async fetchAllDeputies(): Promise<DeputyWithOrganes[]> {
    if (
      this.cacheExpiry &&
      new Date() < this.cacheExpiry &&
      this.cachedActeurs
    ) {
      return this.cachedActeurs;
    }

    console.log("Downloading deputies from Assemblée nationale...");
    // Use the global fetch provided by the Node.js runtime, avoiding ESM-only node-fetch.
    const response = await (globalThis as any).fetch(AMO_DEPUTIES_ZIP_URL);

    if (!response.ok) {
      throw new Error(`Failed to download deputies: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const acteurs: AssembleeActeur[] = [];
    const organesMap = new Map<string, AssembleeOrgane>();

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(unzipper.Parse())
        .on("entry", async (entry: unzipper.Entry) => {
          const fileName = entry.path;
          // Parse any .json (main composite or json/acteurs/..., json/organes/...)
          if (fileName.endsWith(".json") && !fileName.includes("__")) {
            try {
              const content = await entry.buffer();
              const text = content.toString("utf-8");
              const data = JSON.parse(text);

              // Composite format: export.acteurs.acteur, export.organes.organe
              const exportData = data.export ?? data;
              const acteursData =
                exportData.acteurs?.acteur ?? data.acteurs ?? data.acteur;
              // Organes: try export, then root; support both .organe (array) and .organes.organe
              const organesData =
                exportData.organes?.organe ??
                (Array.isArray(exportData.organes)
                  ? exportData.organes
                  : null) ??
                data.organes?.organe ??
                (Array.isArray(data.organes) ? data.organes : null) ??
                data.organe;

              if (acteursData) {
                toList(acteursData).forEach((a: AssembleeActeur) => {
                  const uid = extractUid(a?.uid);
                  if (uid) acteurs.push(a);
                });
              }
              if (organesData) {
                toList(organesData).forEach((o: AssembleeOrgane) => {
                  const uid = extractUid(o?.uid);
                  if (uid) organesMap.set(uid, o);
                });
              }

              // Divided format: acteurs/PA*.json - single acteur per file
              const singleUid = extractUid(data.uid);
              if (fileName.includes("acteurs/") && singleUid && !acteursData) {
                acteurs.push(data as AssembleeActeur);
              }
              if (fileName.includes("organes/") && singleUid && !organesData) {
                organesMap.set(singleUid, data as AssembleeOrgane);
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

    const result: DeputyWithOrganes[] = acteurs.map((acteur) => ({
      acteur,
      organesMap,
    }));

    console.log(`Loaded ${result.length} deputies from archive`);
    this.cachedActeurs = result;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION_MS);
    return result;
  }
}

export const deputiesClient = new DeputiesClient();
