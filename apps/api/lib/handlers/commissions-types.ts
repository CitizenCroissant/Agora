/**
 * GET /api/commissions/types
 * List organe types (for commission type filter). Excludes CIRCONSCRIPTION (has dedicated /circonscriptions page).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";

/** Known type codes and their display labels (Assemblée AMO / codeTypeOrgane). */
const TYPE_LABELS: Record<string, string> = {
  COMPER: "Commission permanente",
  COSP: "Commission spéciale",
  COMEU: "Commission d'enquête",
  MINS: "Mission d'information",
  DELE: "Délégation",
  GE: "Groupe d'études",
  GA: "Groupe d'amitié",
  API: "Assemblée parlementaire internationale",
  ASSEMBLEE: "Assemblée",
  BUREAU: "Bureau",
  COLLEGES: "Collèges",
  CONFERENCE: "Conférence",
  MIXTE: "Commission mixte",
  OFFICE: "Office",
  MISSION: "Mission",
  AUTRE: "Autre organe"
};

/** Types to exclude from commissions list (e.g. circonscriptions have their own page). */
const EXCLUDED_TYPES = ["CIRCONSCRIPTION"];

const TYPE_ORDER: Record<string, number> = {
  COMPER: 0,
  COSP: 1,
  COMEU: 2,
  MINS: 3,
  DELE: 4,
  GE: 5,
  GA: 6,
  API: 7,
  ASSEMBLEE: 8,
  BUREAU: 9,
  MIXTE: 10,
  OFFICE: 11,
  MISSION: 12,
  CONFERENCE: 13,
  COLLEGES: 14,
  AUTRE: 99
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405
    });
  }

  try {
    const { data: rows, error } = await supabase
      .from("organes")
      .select("type_organe");

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(
        500,
        "Failed to fetch commission types",
        "DatabaseError"
      );
    }

    // Return ALL known types (curated list) so the dropdown always shows e.g. Commission permanente, Commission spéciale, etc.
    // Also include any type present in the DB that we don't have a label for (label = code).
    const fromDb = (rows ?? [])
      .map((r: { type_organe: string }) => r.type_organe)
      .filter((code) => !EXCLUDED_TYPES.includes(code));

    const union = new Set<string>(fromDb);
    for (const code of Object.keys(TYPE_LABELS)) {
      if (!EXCLUDED_TYPES.includes(code)) union.add(code);
    }

    const unique = [...union];

    const types = unique
      .sort(
        (a, b) =>
          (TYPE_ORDER[a] ?? 99) - (TYPE_ORDER[b] ?? 99) || a.localeCompare(b)
      )
      .map((code) => ({
        code,
        label: TYPE_LABELS[code] ?? code
      }));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ types });
  } catch (e) {
    return handleError(res, e);
  }
}
