/**
 * Client for official circonscriptions législatives data
 * Source: data.gouv.fr – Contours géographiques des circonscriptions législatives (GeoJSON)
 * https://www.data.gouv.fr/datasets/contours-geographiques-des-circonscriptions-legislatives
 * Data derived from Ministère de l'Intérieur + INSEE (Open Licence 2.0).
 */


/** p10 = very simplified GeoJSON (~5.4 MB); p20 = simplified (~10 MB) */
const GEOJSON_P10_URL =
  "https://static.data.gouv.fr/resources/contours-geographiques-des-circonscriptions-legislatives/20240613-191520/circonscriptions-legislatives-p10.geojson";

/** GeoJSON geometry (Polygon or MultiPolygon) for map overlay */
export type GeoJSONGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export interface CirconscriptionFromSource {
  id: string;
  label: string;
  geometry: GeoJSONGeometry | null;
}

interface GeoJSONFeature {
  type: string;
  properties?: {
    codeDepartement?: string;
    nomDepartement?: string;
    codeCirconscription?: string;
    nomCirconscription?: string;
  };
  geometry?: unknown;
}

interface GeoJSONFeatureCollection {
  type: string;
  features?: GeoJSONFeature[];
}

/**
 * Build display label from department name and ordinal (e.g. "Ain", 4 → "Ain - 4e circonscription").
 * Matches format used in shared package (resolveCirconscriptionName / getCirconscriptionLabelsForId).
 */
function buildLabel(nomDepartement: string, num: number): string {
  const ord = num === 1 ? "1ère" : `${num}e`;
  return `${nomDepartement} - ${ord} circonscription`;
}

/**
 * Parse codeCirconscription and codeDepartement into canonical id + ordinal.
 * Canonical id must match shared circonscriptionRefCanonical (dept + 2-digit ordinal)
 * so deputies.ref_circonscription FK matches circonscriptions.id.
 */
function parseCode(
  codeCirconscription: string,
  codeDepartement: string,
): { id: string; num: number } | null {
  const code = String(codeCirconscription ?? "").trim();
  const dept = String(codeDepartement ?? "").trim();
  if (!code || !dept) return null;
  let num: number;
  if (/^97[1-6]/.test(code)) {
    const numStr = code.length === 4 ? code.slice(-1) : code.slice(-2);
    num = parseInt(numStr, 10);
  } else {
    num = parseInt(code.slice(-2), 10);
  }
  if (Number.isNaN(num) || num < 1) return null;
  const id = dept + String(num).padStart(2, "0");
  return { id, num };
}

/**
 * Fetch circonscriptions from the official data.gouv.fr GeoJSON and return
 * list of { id, label } with canonical id (codeCirconscription) and display label.
 */
export async function fetchCirconscriptionsFromSource(): Promise<
  CirconscriptionFromSource[]
> {
  console.log(
    "Fetching circonscriptions from data.gouv.fr (official GeoJSON)...",
  );
  // Use the global fetch provided by the Node.js runtime, avoiding ESM-only node-fetch.
  const response = await (globalThis as any).fetch(GEOJSON_P10_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch GeoJSON: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as GeoJSONFeatureCollection;
  const features = json?.features ?? [];
  const byId = new Map<
    string,
    { label: string; geometry: GeoJSONGeometry | null }
  >();

  for (const f of features) {
    const props = f?.properties;
    const codeCirco = props?.codeCirconscription?.trim();
    const codeDept = props?.codeDepartement?.trim();
    const nomDept = props?.nomDepartement?.trim();
    if (!codeCirco || !codeDept || !nomDept) continue;

    const parsed = parseCode(codeCirco, codeDept);
    if (!parsed) continue;

    const label = buildLabel(nomDept, parsed.num);
    const geom = f.geometry as GeoJSONGeometry | undefined;
    const geometry =
      geom && (geom.type === "Polygon" || geom.type === "MultiPolygon")
        ? geom
        : null;
    byId.set(parsed.id, { label, geometry });
  }

  const list = Array.from(byId.entries()).map(([id, { label, geometry }]) => ({
    id,
    label,
    geometry,
  }));

  console.log(
    `Parsed ${list.length} circonscriptions from GeoJSON (${features.length} features)`,
  );
  return list;
}
