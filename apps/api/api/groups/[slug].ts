/**
 * GET /api/groups/[slug]
 * Returns political group detail with deputies by slug (slugified groupe_politique)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { ApiError, handleError } from "../../lib/errors";
import { slugify } from "@agora/shared";
import type { Deputy, PoliticalGroupDetail } from "@agora/shared";

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
    const slug = (req.query.slug ?? (req as any).params?.slug) as string;

    if (!slug || typeof slug !== "string") {
      throw new ApiError(400, "slug is required", "BadRequest");
    }

    // Get distinct groupe_politique to resolve slug -> label
    const { data: allDeputies, error: listError } = await supabase
      .from("deputies")
      .select("groupe_politique")
      .not("groupe_politique", "is", null);

    if (listError) {
      throw new ApiError(500, "Failed to fetch groups", "DatabaseError");
    }

    const labels = [
      ...new Set(
        (allDeputies ?? [])
          .map((r) => (r.groupe_politique ?? "").trim())
          .filter(Boolean),
      ),
    ];
    const labelBySlug = new Map(labels.map((l) => [slugify(l), l]));
    const label = labelBySlug.get(slug);

    if (!label) {
      throw new ApiError(404, "Political group not found", "NotFound");
    }

    const { data: deputiesRows, error } = await supabase
      .from("deputies")
      .select("*")
      .eq("groupe_politique", label)
      .order("civil_nom", { ascending: true });

    if (error) {
      throw new ApiError(500, "Failed to fetch deputies", "DatabaseError");
    }

    const deputies: Deputy[] = (deputiesRows ?? []).map((d) => ({
      acteur_ref: d.acteur_ref,
      civil_nom: d.civil_nom,
      civil_prenom: d.civil_prenom,
      date_naissance: d.date_naissance,
      lieu_naissance: d.lieu_naissance,
      profession: d.profession,
      sexe: d.sexe,
      parti_politique: d.parti_politique,
      groupe_politique: d.groupe_politique,
      circonscription: d.circonscription,
      departement: d.departement,
      date_debut_mandat: d.date_debut_mandat,
      legislature: d.legislature,
      official_url: d.official_url,
    }));

    const response: PoliticalGroupDetail = {
      slug,
      label,
      deputy_count: deputies.length,
      deputies,
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
