/**
 * GET /api/commissions/:id
 * Single organe (commission, etc.) by id.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type { Organe } from "@agora/shared";

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

  try {
    const id = (req as any).pathParams?.id ?? req.query?.id;
    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Commission id is required", "BadRequest");
    }

    const { data: row, error } = await supabase
      .from("organes")
      .select("id, libelle, libelle_abrege, type_organe, official_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(500, "Failed to fetch commission", "DatabaseError");
    }

    if (!row) {
      throw new ApiError(404, "Commission not found", "NotFound");
    }

    const organe: Organe = {
      id: row.id,
      libelle: row.libelle ?? null,
      libelle_abrege: row.libelle_abrege ?? null,
      type_organe: row.type_organe,
      official_url: row.official_url ?? null
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(organe);
  } catch (e) {
    return handleError(res, e);
  }
}
