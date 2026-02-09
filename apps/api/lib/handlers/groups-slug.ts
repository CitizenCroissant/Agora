/**
 * GET /api/groups/[slug]
 * Returns political group detail with deputies by slug (slugified groupe_politique)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { slugify, getCirconscriptionDisplayName } from "@agora/shared";
import type {
  Deputy,
  PoliticalGroupDetail,
  PoliticalOrientation,
  PoliticalPosition,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slug = ((req as any).pathParams?.slug ??
      req.query?.slug ??
      (req as any).params?.slug) as string;

    if (!slug || typeof slug !== "string") {
      throw new ApiError(400, "slug is required", "BadRequest");
    }

    // Resolve slug -> label: try metadata first (reliable), then distinct from deputies
    let label: string | null = null;
    let metaRow: {
      label?: string | null;
      date_debut?: string | null;
      date_fin?: string | null;
      position_politique?: string | null;
      orientation?: string | null;
      couleur_hex?: string | null;
      president_name?: string | null;
      legislature?: number | null;
      official_url?: string | null;
    } | null = null;
    const { data: metaRowBySlug } = await supabase
      .from("political_groups_metadata")
      .select(
        "label, date_debut, date_fin, position_politique, orientation, couleur_hex, president_name, legislature, official_url",
      )
      .eq("slug", slug)
      .maybeSingle();
    if (metaRowBySlug?.label) {
      label = metaRowBySlug.label;
      metaRow = metaRowBySlug;
    }
    if (!label) {
      const { data: allDeputies, error: listError } = await supabase
        .from("deputies")
        .select("groupe_politique")
        .not("groupe_politique", "is", null)
        .limit(10000);
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
      label = labelBySlug.get(slug) ?? null;
    }
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
      circonscription:
        getCirconscriptionDisplayName(d.circonscription) ?? d.circonscription,
      circonscription_ref: d.ref_circonscription ?? null,
      departement: d.departement,
      date_debut_mandat: d.date_debut_mandat,
      date_fin_mandat: d.date_fin_mandat ?? null,
      legislature: d.legislature,
      official_url: d.official_url,
    }));

    // Optional metadata (already loaded above if we had a metadata row)
    let metadata: PoliticalGroupDetail["metadata"] = null;
    if (metaRow) {
      metadata = {
        date_debut: metaRow.date_debut ?? null,
        date_fin: metaRow.date_fin ?? null,
        position_politique: (metaRow.position_politique ??
          null) as PoliticalPosition | null,
        orientation: (metaRow.orientation ??
          null) as PoliticalOrientation | null,
        color_hex: metaRow.couleur_hex ?? null,
        president_name: metaRow.president_name ?? null,
        legislature: metaRow.legislature ?? null,
        official_url: metaRow.official_url ?? null,
      };
    }

    const response: PoliticalGroupDetail = {
      slug,
      label,
      deputy_count: deputies.length,
      deputies,
      metadata: metadata ?? undefined,
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
