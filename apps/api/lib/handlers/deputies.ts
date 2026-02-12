/**
 * GET /api/deputies?departement=Paris
 * Returns list of deputies filtered by geographic criteria (departement).
 * Query param: departement (required) - exact match on deputies.departement.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import {
  getCirconscriptionDisplayName,
  getCanonicalDepartementName,
  getDepartementQueryValues
} from "@agora/shared";
import type { Deputy, DeputiesListResponse } from "@agora/shared";

type DeputyRow = {
  acteur_ref: string;
  civil_nom: string;
  civil_prenom: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  profession: string | null;
  sexe: string | null;
  parti_politique: string | null;
  groupe_politique: string | null;
  circonscription: string | null;
  ref_circonscription: string | null;
  departement: string | null;
  date_debut_mandat: string | null;
  date_fin_mandat: string | null;
  legislature: number | null;
  official_url: string | null;
};

function toDeputy(row: DeputyRow): Deputy {
  return {
    acteur_ref: row.acteur_ref,
    civil_nom: row.civil_nom,
    civil_prenom: row.civil_prenom,
    date_naissance: row.date_naissance,
    lieu_naissance: row.lieu_naissance,
    profession: row.profession,
    sexe: row.sexe,
    parti_politique: row.parti_politique,
    groupe_politique: row.groupe_politique,
    circonscription:
      getCirconscriptionDisplayName(row.circonscription) ?? row.circonscription,
    circonscription_ref: row.ref_circonscription ?? null,
    departement: row.departement,
    date_debut_mandat: row.date_debut_mandat,
    date_fin_mandat: row.date_fin_mandat ?? null,
    legislature: row.legislature,
    official_url: row.official_url
  };
}

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
      status: 405
    });
  }

  try {
    const departementParam = (req.query.departement as string | undefined)?.trim();

    if (!departementParam) {
      throw new ApiError(
        400,
        "Query param 'departement' is required (e.g. ?departement=Paris)",
        "BadRequest"
      );
    }

    const canonicalName = getCanonicalDepartementName(departementParam);
    const queryValues = canonicalName
      ? getDepartementQueryValues(canonicalName)
      : [departementParam];

    const { data: rows, error } = await supabase
      .from("deputies")
      .select("*")
      .in("departement", queryValues)
      .order("civil_nom", { ascending: true });

    if (error) {
      throw new ApiError(500, "Failed to fetch deputies", "DatabaseError");
    }

    const deputies = (rows ?? []).map((r) => toDeputy(r as DeputyRow));
    const response: DeputiesListResponse = { deputies };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
