/**
 * GET /api/commissions
 * List organes (commissions, delegations, etc.). Requires ?type=COMPER etc. (use /api/commissions/types for options).
 * Excludes CIRCONSCRIPTION (circonscriptions have dedicated /circonscriptions page).
 * Maps canonical types to DB type_organe codes (AMO uses e.g. DELEG, MISINFO, COMSPSENAT).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type { Organe } from "@agora/shared";

const EXCLUDED_TYPES = ["CIRCONSCRIPTION"];

/** Canonical type (dropdown) → DB type_organe values (AMO uses different codes). */
const TYPE_TO_DB_CODES: Record<string, string[]> = {
  COMPER: ["COMPER"],
  COSP: ["COSP", "COMSPSENAT", "COMNL"],
  COMEU: ["COMEU"],
  MINS: ["MINS", "MISINFO", "MISINFOCOM", "MISINFOPRE"],
  DELE: ["DELE", "DELEG", "DELEGBUREAU", "DELEGSENAT"],
  GE: ["GE", "GEVI"],
  GA: ["GA"],
  API: ["API", "ORGEXTPARL"],
  ASSEMBLEE: ["ASSEMBLEE"],
  BUREAU: ["BUREAU"],
  MIXTE: ["MIXTE", "CMP"],
  OFFICE: ["OFFICE", "OFFPAR", "CNPE", "CNPS"],
  MISSION: ["MISSION"],
  CONFERENCE: ["CONFERENCE", "CONFPT"],
  COLLEGES: ["COLLEGES"],
  AUTRE: ["AUTRE", "GP", "PARPOL", "MINISTERE", "GOUVERNEMENT", "PRESREP", "COMSENAT", "GROUPESENAT", "SENAT", "CONSTITU", "HCJ", "CJR"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const typeFilter = req.query?.type;
  if (!typeFilter || typeof typeFilter !== "string") {
    return res.status(400).json({
      error: "BadRequest",
      message: "Query parameter 'type' is required (e.g. ?type=COMPER). Use GET /api/commissions/types for available types.",
      status: 400
    });
  }
  if (EXCLUDED_TYPES.includes(typeFilter)) {
    return res.status(400).json({
      error: "BadRequest",
      message: "Use the circonscriptions API for electoral constituencies.",
      status: 400
    });
  }

  try {
    const dbCodes = TYPE_TO_DB_CODES[typeFilter] ?? [typeFilter];
    let query = supabase
      .from("organes")
      .select("id, libelle, libelle_abrege, type_organe, official_url");

    if (dbCodes.length === 1) {
      query = query.eq("type_organe", dbCodes[0]);
    } else {
      query = query.in("type_organe", dbCodes);
    }
    query = query.order("libelle", { ascending: true, nullsFirst: false });

    const { data: rows, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(500, "Failed to fetch commissions", "DatabaseError");
    }

    const organes: Organe[] = (rows ?? []).map((r: { id: string; libelle: string | null; libelle_abrege: string | null; type_organe: string; official_url: string | null }) => ({
      id: r.id,
      libelle: r.libelle ?? null,
      libelle_abrege: r.libelle_abrege ?? null,
      type_organe: r.type_organe,
      official_url: r.official_url ?? null
    }));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(organes);
  } catch (e) {
    return handleError(res, e);
  }
}
