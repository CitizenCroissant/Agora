/**
 * GET /api/departements
 * Returns list of all French départements (métropole + DOM-TOM) with deputy count from DB (current mandate only).
 * Departments with no deputies in the database have deputy_count 0.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { ApiError, handleError } from "../../lib/errors";
import { isCurrentlySitting, ALL_DEPARTEMENT_NAMES } from "@agora/shared";
import type {
  DepartementSummary,
  DepartementsListResponse,
} from "@agora/shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405,
    });
  }

  try {
    const { data: deputyRows, error } = await supabase
      .from("deputies")
      .select("departement, date_fin_mandat")
      .not("departement", "is", null);

    if (error) {
      throw new ApiError(500, "Failed to fetch departements", "DatabaseError");
    }

    const countByName = new Map<string, number>();
    for (const row of deputyRows ?? []) {
      const name = (row.departement ?? "").trim();
      if (!name) continue;
      if (isCurrentlySitting(row.date_fin_mandat ?? null)) {
        countByName.set(name, (countByName.get(name) ?? 0) + 1);
      }
    }

    const departements: DepartementSummary[] = ALL_DEPARTEMENT_NAMES.map(
      (name) => ({
        name,
        deputy_count: countByName.get(name) ?? 0,
      })
    );

    const response: DepartementsListResponse = { departements };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
