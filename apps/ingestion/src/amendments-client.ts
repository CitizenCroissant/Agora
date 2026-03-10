/**
 * Client for Assemblée nationale Amendements open data (lightweight Option B).
 * Fetches Amendements.json.zip for a legislature and yields (dossierRef, official_id, numero)
 * for each amendment so we can store only amendments for bills we have.
 *
 * Source: https://data.assemblee-nationale.fr/static/openData/repository/{leg}/loi/amendements_div_legis/Amendements.json.zip
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import type { AmendmentInsert } from "./amendments-types";

const BASE_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository";

function amendmentZipUrl(legislature: string): string {
  return `${BASE_URL}/${legislature}/loi/amendements_div_legis/Amendements.json.zip`;
}

/** Extract dossier ref (for bill lookup). Prefer dossierRef; fall back to texteRef if no dossier ref. */
function getDossierRef(raw: Record<string, unknown>): string | null {
  const texte = raw.texte as Record<string, unknown> | undefined;
  const ref =
    raw.dossierRef ??
    raw.DossierRef ??
    texte?.dossierRef ??
    texte?.DossierRef ??
    raw.texteRef ??
    texte?.texteRef;
  if (typeof ref === "string" && ref.trim()) return ref.trim();
  return null;
}

/** Extract texte ref (document version). When absent, caller uses dossierRef as texte ref. */
function getTexteRef(raw: Record<string, unknown>): string | null {
  const texte = raw.texte as Record<string, unknown> | undefined;
  const ref =
    raw.texteRef ??
    raw.TexteRef ??
    texte?.texteRef ??
    texte?.TexteRef ??
    raw.texteLegislatifRef ??
    (texte as Record<string, unknown> | undefined)?.texteLegislatifRef;
  if (typeof ref === "string" && ref.trim()) return ref.trim();
  return null;
}

/** Extract amendment uid (official_id). */
function getOfficialId(raw: Record<string, unknown>): string | null {
  const uid = raw.uid ?? raw.UID ?? raw.identifiant;
  if (typeof uid === "string" && uid.trim()) return uid.trim();
  if (uid && typeof uid === "object" && "value" in (uid as object)) {
    const v = (uid as Record<string, unknown>).value;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Extract numero (display number). 17th leg uses identification.numeroOrdreDepot or numeroLong. */
function getNumero(raw: Record<string, unknown>): string | null {
  const ident = raw.identification as Record<string, unknown> | undefined;
  const n =
    raw.numero ??
    raw.Numero ??
    ident?.numeroOrdreDepot ??
    ident?.numeroLong ??
    (raw.identifiant as Record<string, unknown>)?.numero ??
    (raw.identifiant as Record<string, unknown>)?.Numero;
  if (typeof n === "string" && n.trim()) return n.trim();
  if (typeof n === "number" && !Number.isNaN(n)) return String(n);
  return null;
}

/** Build official URL for an amendment (AN pattern: /dyn/{leg}/amendements/{uid}). */
function buildAmendmentUrl(legislature: string, officialId: string): string {
  return `https://www.assemblee-nationale.fr/dyn/${legislature}/amendements/${officialId}`;
}

/**
 * Parse one amendment JSON entry (file or wrapper). Returns null if no dossierRef or no official_id.
 * dossierRefFromPath: when the ZIP path is json/DLR5L17N51777/..., the dossier ref is the first segment after "json/".
 */
function parseAmendmentEntry(
  data: unknown,
  legislature: string,
  dossierRefFromPath?: string | null
): {
  dossierRef: string;
  texteRef: string | null;
  official_id: string;
  numero: string;
  official_url: string;
} | null {
  const raw =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;
  if (!raw) return null;

  // Unwrap if nested (e.g. { amendement: { ... } })
  const amend =
    raw.amendement ?? raw.Amendement ?? raw;
  const obj =
    amend && typeof amend === "object" ? (amend as Record<string, unknown>) : raw;

  const dossierRef = getDossierRef(obj) ?? dossierRefFromPath ?? null;
  const texteRef = getTexteRef(obj);
  const official_id = getOfficialId(obj);
  const numero = getNumero(obj);

  if (!dossierRef || !official_id) return null;
  const num = numero ?? official_id;
  const official_url = buildAmendmentUrl(legislature, official_id);

  return { dossierRef, texteRef, official_id, numero: num, official_url };
}

/** Extract dossier ref from ZIP entry path: json/DLR5L17N51777/... -> DLR5L17N51777 */
function dossierRefFromEntryPath(entryPath: string): string | null {
  const parts = entryPath.split("/").filter(Boolean);
  if (parts[0] === "json" && parts[1] && parts[1].length > 5) return parts[1];
  return null;
}

export interface AmendmentListItem {
  dossierRef: string;
  /** Texte (document version) this amendment is on; when null, use dossierRef as texte ref. */
  texteRef: string | null;
  official_id: string;
  numero: string;
  official_url: string;
}

/**
 * Fetch the amendments ZIP for a legislature and yield amendment list items.
 * Only in-memory: caller should filter by bill official_ids and then upsert.
 */
export async function fetchAmendmentListForLegislature(
  legislature: string
): Promise<AmendmentListItem[]> {
  const url = amendmentZipUrl(legislature);
  console.log(`Downloading amendments from ${url}...`);

  const response = await (globalThis as unknown as { fetch: (u: string) => Promise<Response> }).fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download amendments (${legislature}): ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const items: AmendmentListItem[] = [];

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        const fileName = entry.path;
        if (!fileName.endsWith(".json") || fileName.includes("__")) {
          entry.autodrain();
          return;
        }
        try {
          const content = await entry.buffer();
          const data = JSON.parse(content.toString("utf-8")) as unknown;
          const dossierRefFromPath = dossierRefFromEntryPath(fileName);
          // One file per amendment (path like json/DLR5L17N51777/.../AMANR....json)
          const parsed = parseAmendmentEntry(data, legislature, dossierRefFromPath);
          if (parsed) items.push(parsed);
          // Fallback: single file with array (other legislatures?)
          if (!parsed && data && typeof data === "object") {
            const root = data as Record<string, unknown>;
            const exportObj = root.export as Record<string, unknown> | undefined;
            const fromExport =
              exportObj?.amendements ??
              exportObj?.amendement ??
              (exportObj?.actesLegislatifs as Record<string, unknown>)?.amendement;
            const toProcess = Array.isArray(data) ? data : root.amendements ?? root.amendement ?? fromExport;
            const arr = Array.isArray(toProcess) ? toProcess : toProcess ? [toProcess] : [];
            for (const one of arr) {
              const p = parseAmendmentEntry(one, legislature, dossierRefFromPath);
              if (p) items.push(p);
            }
          }
        } catch {
          // skip malformed entry
        }
        entry.autodrain();
      })
      .on("error", reject)
      .on("close", resolve);
  });

  console.log(`Loaded ${items.length} amendment list items (legislature ${legislature})`);
  return items;
}

/** Leading digits of numero for numeric sort (e.g. "42" -> 42, "42-C" -> 42). */
function numeroSortKey(numero: string): number | null {
  const m = numero.match(/^\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Key for billTextIdByKey: dossierRef + texte ref (same as dossierRef when no distinct texte).
 * Use tab to avoid collisions with refs that might contain colons.
 */
export function billTextMapKey(dossierRef: string, texteRef: string | null): string {
  return `${dossierRef}\t${texteRef ?? dossierRef}`;
}

/**
 * Build AmendmentInsert rows for amendments whose dossierRef is in our bills.
 * billTextIdByKey maps key from billTextMapKey(dossierRef, texteRef) -> bill_texts.id.
 * One row per (bill_text_id, numero): dedupes by amendment number per texte.
 */
export function mapAmendmentsToBillTexts(
  items: AmendmentListItem[],
  billTextIdByKey: Map<string, string>
): AmendmentInsert[] {
  const seen = new Map<string, AmendmentInsert>();
  for (const it of items) {
    const key = billTextMapKey(it.dossierRef, it.texteRef);
    const bill_text_id = billTextIdByKey.get(key);
    if (!bill_text_id) continue;
    const dedupeKey = `${bill_text_id}:${it.numero}`;
    if (seen.has(dedupeKey)) continue;
    seen.set(dedupeKey, {
      bill_text_id,
      official_id: it.official_id,
      numero: it.numero,
      official_url: it.official_url,
      numero_sort: numeroSortKey(it.numero) ?? null
    });
  }
  return Array.from(seen.values());
}
