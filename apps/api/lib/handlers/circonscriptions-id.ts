/**
 * GET /api/circonscriptions/[id]
 * Returns circonscription detail with deputies by id (e.g. "1801", "7505")
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import {
  getCirconscriptionDisplayName,
  isCurrentlySitting,
  getCirconscriptionLabelsForId,
} from "@agora/shared";
import type { Deputy, CirconscriptionDetail } from "@agora/shared";

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

function toDeputy(d: DeputyRow): Deputy {
  return {
    acteur_ref: d.acteur_ref,
    civil_nom: d.civil_nom,
    civil_prenom: d.civil_prenom,
    date_naissance: d.date_naissance,
    lieu_naissance: d.lieu_naissance,
    profession: d.profession,
    sexe: d.sexe,
    parti_politique: d.parti_politique,
    groupe_politique: d.groupe_politique,
    circonscription:
      getCirconscriptionDisplayName(d.circonscription) ?? d.circonscription,
    circonscription_ref: d.ref_circonscription ?? null,
    departement: d.departement,
    date_debut_mandat: d.date_debut_mandat,
    date_fin_mandat: d.date_fin_mandat ?? null,
    legislature: d.legislature,
    official_url: d.official_url,
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
      status: 405,
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (req.query.id ?? (req as any).params?.id) as string;

    if (!id || typeof id !== "string") {
      throw new ApiError(400, "id is required", "BadRequest");
    }

    const normalizedId = (typeof id === "string" ? id : "").trim();

    let matching: DeputyRow[] | null = null;
    let err: unknown = null;

    const { data: byRef, error: errRef } = await supabase
      .from("deputies")
      .select("*")
      .eq("ref_circonscription", normalizedId)
      .order("civil_nom", { ascending: true });

    if (errRef) {
      err = errRef;
    } else if ((byRef ?? []).length > 0) {
      matching = byRef as DeputyRow[];
    }

    if (!matching?.length) {
      const labels = getCirconscriptionLabelsForId(normalizedId);
      if (labels.length > 0) {
        const { data: byLabels, error: errLabels } = await supabase
          .from("deputies")
          .select("*")
          .in("circonscription", labels)
          .order("civil_nom", { ascending: true });
        if (!errLabels && (byLabels ?? []).length > 0)
          matching = byLabels as DeputyRow[];
        else if (errLabels) err = errLabels;
      }
    }

    if (err) {
      throw new ApiError(500, "Failed to fetch deputies", "DatabaseError");
    }
    if (!matching || matching.length === 0) {
      throw new ApiError(404, "Circonscription not found", "NotFound");
    }

    // Return all deputies (active + former), but deputy_count = active only (matches list)
    const allDeputies = matching.map(toDeputy);
    const activeCount = matching.filter((d) =>
      isCurrentlySitting(d.date_fin_mandat ?? null),
    ).length;

    const label =
      getCirconscriptionDisplayName(matching[0].circonscription) ??
      matching[0].circonscription ??
      normalizedId;

    const response: CirconscriptionDetail = {
      id: normalizedId,
      label,
      deputy_count: activeCount,
      deputies: allDeputies,
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
