/**
 * GET /api/scrutins?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import { DbScrutin } from "../types";
import { ScrutinsResponse } from "@agora/shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405,
    });
  }

  try {
    const { from, to } = req.query;
    if (!from || typeof from !== "string") {
      throw new ApiError(400, "From date parameter is required", "BadRequest");
    }
    if (!to || typeof to !== "string") {
      throw new ApiError(400, "To date parameter is required", "BadRequest");
    }
    if (!validateDateFormat(from) || !validateDateFormat(to)) {
      throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD", "BadRequest");
    }
    if (new Date(from) > new Date(to)) {
      throw new ApiError(400, "From date must be before or equal to to date", "BadRequest");
    }

    const { data: scrutins, error } = await supabase
      .from("scrutins")
      .select("*")
      .gte("date_scrutin", from)
      .lte("date_scrutin", to)
      .order("date_scrutin", { ascending: false })
      .order("numero", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
    }

    const response: ScrutinsResponse = {
      from,
      to,
      scrutins: (scrutins || []).map((row: DbScrutin) => ({
        id: row.id,
        official_id: row.official_id,
        sitting_id: row.sitting_id,
        date_scrutin: row.date_scrutin,
        numero: row.numero,
        type_vote_code: row.type_vote_code,
        type_vote_libelle: row.type_vote_libelle,
        sort_code: row.sort_code,
        sort_libelle: row.sort_libelle,
        titre: row.titre,
        synthese_pour: row.synthese_pour,
        synthese_contre: row.synthese_contre,
        synthese_abstentions: row.synthese_abstentions,
        synthese_non_votants: row.synthese_non_votants,
        official_url: row.official_url,
      })),
      source: {
        label: "Assemblée nationale - Scrutins",
        last_updated_at: scrutins?.[0]?.updated_at,
      },
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
