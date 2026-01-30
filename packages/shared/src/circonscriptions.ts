/**
 * Circonscription (electoral constituency) utilities
 * Maps Assemblée nationale refCirconscription codes to human-readable names
 */

import { slugify } from "./utils";

/** French department code → name (métropole + DOM-TOM) */
const DEPARTEMENTS: Record<string, string> = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardèche",
  "08": "Ardennes",
  "09": "Ariège",
  "10": "Aube",
  "11": "Aude",
  "12": "Aveyron",
  "13": "Bouches-du-Rhône",
  "14": "Calvados",
  "15": "Cantal",
  "16": "Charente",
  "17": "Charente-Maritime",
  "18": "Cher",
  "19": "Corrèze",
  "21": "Côte-d'Or",
  "22": "Côtes-d'Armor",
  "23": "Creuse",
  "24": "Dordogne",
  "25": "Doubs",
  "26": "Drôme",
  "27": "Eure",
  "28": "Eure-et-Loir",
  "29": "Finistère",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "33": "Gironde",
  "34": "Hérault",
  "35": "Ille-et-Vilaine",
  "36": "Indre",
  "37": "Indre-et-Loire",
  "38": "Isère",
  "39": "Jura",
  "40": "Landes",
  "41": "Loir-et-Cher",
  "42": "Loire",
  "43": "Haute-Loire",
  "44": "Loire-Atlantique",
  "45": "Loiret",
  "46": "Lot",
  "47": "Lot-et-Garonne",
  "48": "Lozère",
  "49": "Maine-et-Loire",
  "50": "Manche",
  "51": "Marne",
  "52": "Haute-Marne",
  "53": "Mayenne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "56": "Morbihan",
  "57": "Moselle",
  "58": "Nièvre",
  "59": "Nord",
  "60": "Oise",
  "61": "Orne",
  "62": "Pas-de-Calais",
  "63": "Puy-de-Dôme",
  "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées",
  "66": "Pyrénées-Orientales",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "69": "Rhône",
  "70": "Haute-Saône",
  "71": "Saône-et-Loire",
  "72": "Sarthe",
  "73": "Savoie",
  "74": "Haute-Savoie",
  "75": "Paris",
  "76": "Seine-Maritime",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "79": "Deux-Sèvres",
  "80": "Somme",
  "81": "Tarn",
  "82": "Tarn-et-Garonne",
  "83": "Var",
  "84": "Vaucluse",
  "85": "Vendée",
  "86": "Vienne",
  "87": "Haute-Vienne",
  "88": "Vosges",
  "89": "Yonne",
  "90": "Territoire de Belfort",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
  "971": "Guadeloupe",
  "972": "Martinique",
  "973": "Guyane",
  "974": "La Réunion",
  "976": "Mayotte",
};

/**
 * Parse refCirconscription ID (e.g. "7505", "PO7500501", "2A01", "9711") into department + num
 * Returns null if unparseable
 */
function parseRefCirconscription(ref: string): {
  departement: string;
  num: number;
} | null {
  const raw = String(ref || "").trim();
  if (!raw) return null;

  // Strip common prefixes (e.g. PO = organe parlementaire)
  let code = raw.replace(/^PO/i, "").replace(/\D+$/, "");

  // Try 2-char dept + 1-2 digit num: 7505, 1301, 2A01
  const twoChar = code.match(/^(\d{2})(\d{1,2})$/);
  if (twoChar) {
    const dept = twoChar[1];
    const num = parseInt(twoChar[2], 10);
    if (DEPARTEMENTS[dept] && num >= 1) return { departement: dept, num };
  }

  // Try Corse: 2A01, 2B02
  const corse = code.match(/^(2[AB])(\d{1,2})$/i);
  if (corse) {
    const dept = corse[1].toUpperCase();
    const num = parseInt(corse[2], 10);
    if (DEPARTEMENTS[dept] && num >= 1) return { departement: dept, num };
  }

  // Try DOM-TOM: 9711, 9722 (3-digit dept + 1-2 digit num)
  const domtom = code.match(/^(97[1-6])(\d{1,2})$/);
  if (domtom) {
    const dept = domtom[1];
    const num = parseInt(domtom[2], 10);
    if (DEPARTEMENTS[dept] && num >= 1) return { departement: dept, num };
  }

  // Try longer format PO7500501: positions 0-4 = 7505
  if (code.length >= 4) {
    const four = code.slice(0, 4);
    const twoChar2 = four.match(/^(\d{2})(\d{2})$/);
    if (twoChar2) {
      const dept = twoChar2[1];
      const num = parseInt(twoChar2[2], 10);
      if (DEPARTEMENTS[dept] && num >= 1) return { departement: dept, num };
    }
    const corse2 = four.match(/^(2[AB])(\d{2})$/i);
    if (corse2) {
      const dept = corse2[1].toUpperCase();
      const num = parseInt(corse2[2], 10);
      if (DEPARTEMENTS[dept] && num >= 1) return { departement: dept, num };
    }
  }

  return null;
}

/**
 * Canonical ref from official refCirconscription (e.g. "7505", "PO7500501" → "7505"; "1801" → "1801"; "0101" for Ain 1ère).
 * Use when storing or grouping by official ref. Preserves leading zeros (returns string).
 */
export function circonscriptionRefCanonical(
  ref: string | null | undefined,
): string | null {
  if (!ref || typeof ref !== "string") return null;
  const parsed = parseRefCirconscription(ref.trim());
  if (!parsed) return null;
  return parsed.departement + String(parsed.num).padStart(2, "0");
}

/** Department name → code (for parsing display names) */
const CODES_BY_NAME: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [code, name] of Object.entries(DEPARTEMENTS)) m[name] = code;
  return m;
})();

/** Parse display name "Dept - Xe circonscription" to department code + num */
function parseCirconscriptionName(name: string): {
  departement: string;
  num: number;
} | null {
  const raw = String(name ?? "").trim();
  if (!raw) return null;
  // Match longest department name first to avoid "Eure" matching "Eure-et-Loir"
  const deptNames = Object.keys(CODES_BY_NAME).sort(
    (a, b) => b.length - a.length,
  );
  for (const deptName of deptNames) {
    const prefix = deptName + " - ";
    if (!raw.startsWith(prefix)) continue;
    const rest = raw.slice(prefix.length);
    const m = rest.match(/^(\d+)(?:ère|e|ème) circonscription$/i);
    if (m && parseInt(m[1], 10) >= 1) {
      return {
        departement: CODES_BY_NAME[deptName],
        num: parseInt(m[1], 10),
      };
    }
  }
  return null;
}

/**
 * Canonical circonscription ID for URLs (e.g. "1801", "7505", "2A01", "97101").
 * Stable for both ref (e.g. "1801", "PO7500501") and display name (e.g. "Cher - 1e circonscription").
 */
export function circonscriptionId(
  value: string | null | undefined,
): string | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;

  let parsed: { departement: string; num: number } | null = null;
  if (looksLikeCirconscriptionId(s)) {
    parsed = parseRefCirconscription(s);
  } else {
    const name = getCirconscriptionDisplayName(s) ?? s;
    parsed = parseCirconscriptionName(name) ?? parseRefCirconscription(name);
  }
  if (!parsed) return null;
  return parsed.departement + String(parsed.num).padStart(2, "0");
}

/**
 * Return possible circonscription labels in DB for a canonical id (for .in("circonscription", labels)).
 */
export function getCirconscriptionLabelsForId(
  id: string | null | undefined,
): string[] {
  if (!id || typeof id !== "string") return [];
  const parsed = parseRefCirconscription(id.trim());
  if (!parsed) return [];
  const deptName = DEPARTEMENTS[parsed.departement];
  if (!deptName) return [];
  const num = parsed.num;
  const labels: string[] = [];
  labels.push(
    `${deptName} - ${num === 1 ? "1ère" : num + "e"} circonscription`,
  );
  labels.push(`${deptName} - ${num}e circonscription`);
  if (num !== 1) {
    labels.push(`${deptName} - ${num}ème circonscription`);
  }
  return [...new Set(labels)];
}

/**
 * Resolve refCirconscription ID to human-readable name.
 * Returns the name (e.g. "Paris - 5e circonscription") or null if unparseable.
 */
export function resolveCirconscriptionName(
  ref: string | null | undefined,
): string | null {
  if (!ref || typeof ref !== "string") return null;
  const parsed = parseRefCirconscription(ref);
  if (!parsed) return null;

  const deptName = DEPARTEMENTS[parsed.departement];
  if (!deptName) return null;

  const ord = parsed.num === 1 ? "1ère" : `${parsed.num}e`;
  return `${deptName} - ${ord} circonscription`;
}

/**
 * Check if a circonscription string looks like an ID (to resolve) rather than already a name.
 * IDs are typically short alphanumeric: "7505", "PO7500501", "2A01", "9711"
 */
export function looksLikeCirconscriptionId(
  value: string | null | undefined,
): boolean {
  if (!value || typeof value !== "string") return false;
  const s = value.trim();
  // Already has "circonscription" → it's a name
  if (/circonscription/i.test(s)) return false;
  // "X - Ye circonscription" pattern → it's a name
  if (/^\S+ - \d+(?:ère|e) circonscription$/i.test(s)) return false;
  // Short alphanumeric, possibly with PO prefix
  return /^[A-Z0-9]{4,12}$/i.test(s) || /^PO[A-Z0-9]+$/i.test(s);
}

/**
 * Get display name for circonscription: resolve ID to name if needed, else return as-is.
 */
export function getCirconscriptionDisplayName(
  value: string | null | undefined,
): string | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  if (looksLikeCirconscriptionId(s)) {
    return resolveCirconscriptionName(s) ?? s;
  }
  return s;
}

/**
 * Normalize ordinal variants (1ère/1e/1er, 13e/13ème) to canonical "Xe" for consistent slug.
 * Ensures "Paris - 13e circonscription" and "Paris - 13ème circonscription" produce same slug.
 */
function normalizeOrdinalForSlug(name: string): string {
  return name.replace(
    /(\d+)(?:ère|ere|ème|eme|er|e)\s/gi,
    (_, num) => `${num}e `,
  );
}

/**
 * Slug for circonscription URL (from display name or raw value).
 * Uses normalized ordinals so variants like "13e" and "13ème" produce the same slug.
 */
export function circonscriptionSlug(value: string | null | undefined): string {
  const name = getCirconscriptionDisplayName(value) ?? value ?? "";
  const normalized = normalizeOrdinalForSlug(name);
  return slugify(normalized) || "inconnue";
}

/**
 * Normalize an incoming slug for matching (handles URL-decoded variants like 13eme vs 13e).
 * Use when comparing request slug to circonscriptionSlug(deputy).
 */
export function normalizeCirconscriptionSlugForMatch(
  slug: string | null | undefined,
): string {
  const s = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!s) return "";
  // Normalize ordinal variants in slug form: 13eme→13e, 1ere→1e
  return s.replace(/(\d+)e(?:me|re)(?=-|$)/gi, "$1e");
}

/**
 * Return possible circonscription labels that would produce the given slug.
 * Use for DB filtering: .in("circonscription", getCirconscriptionLabelsForSlug(slug)).
 * Handles common variants like "Paris - 13e" and "Paris - 13ème".
 */
export function getCirconscriptionLabelsForSlug(
  slug: string | null | undefined,
): string[] {
  const s = normalizeCirconscriptionSlugForMatch(slug ?? "");
  if (!s) return [];

  const labels: string[] = [];
  const deptNames = [...new Set(Object.values(DEPARTEMENTS))];

  for (const deptName of deptNames) {
    const deptSlug = slugify(deptName);
    if (!s.startsWith(deptSlug + "-")) continue;
    const rest = s.slice(deptSlug.length + 1);
    const match = rest.match(/^(\d+)e-circonscription$/);
    if (!match) continue;
    const num = match[1];
    // Include all label variants that may be stored in DB (ingestion uses "Xe" from API numCirco)
    const ord1 = num === "1" ? "1ère" : `${num}e`;
    labels.push(`${deptName} - ${ord1} circonscription`);
    const ord2 = `${num}e`; // plain "1e", "13e" as stored by ingestion (distinct from 1ère only for num===1)
    if (ord2 !== ord1) labels.push(`${deptName} - ${ord2} circonscription`);
    if (num !== "1") {
      labels.push(`${deptName} - ${num}ème circonscription`);
    }
  }
  return labels;
}
