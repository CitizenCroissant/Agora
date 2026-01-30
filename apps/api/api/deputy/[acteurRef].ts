/**
 * GET /api/deputy/[acteurRef]
 * Returns deputy profile by acteur_ref (e.g. PA842279)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { ApiError, handleError } from "../../lib/errors";
import { Deputy, getCirconscriptionDisplayName } from "@agora/shared";

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
    const acteurRef = (req.query.acteurRef ??
      (req as { params?: { acteurRef?: string } }).params?.acteurRef) as
      | string
      | undefined;

    if (!acteurRef || typeof acteurRef !== "string") {
      throw new ApiError(400, "acteurRef is required", "BadRequest");
    }

    const { data: deputy, error } = await supabase
      .from("deputies")
      .select("*")
      .eq("acteur_ref", acteurRef)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to fetch deputy", "DatabaseError");
    }

    if (!deputy) {
      throw new ApiError(404, "Deputy not found", "NotFound");
    }

    const response: Deputy = {
      acteur_ref: deputy.acteur_ref,
      civil_nom: deputy.civil_nom,
      civil_prenom: deputy.civil_prenom,
      date_naissance: deputy.date_naissance,
      lieu_naissance: deputy.lieu_naissance,
      profession: deputy.profession,
      sexe: deputy.sexe,
      parti_politique: deputy.parti_politique,
      groupe_politique: deputy.groupe_politique,
      circonscription:
        getCirconscriptionDisplayName(deputy.circonscription) ??
        deputy.circonscription,
      circonscription_ref: deputy.ref_circonscription ?? null,
      departement: deputy.departement,
      date_debut_mandat: deputy.date_debut_mandat,
      date_fin_mandat: deputy.date_fin_mandat ?? null,
      legislature: deputy.legislature,
      official_url: deputy.official_url,
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
