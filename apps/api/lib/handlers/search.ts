/**
 * GET /api/search?q=...&type=scrutins|deputies|groups|all
 * Search scrutins (by titre), deputies (by name), and groups (by label)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { DbScrutin } from "../types";
import {
  Deputy,
  PoliticalGroupSummary,
  SearchResponse,
  SearchType,
  getCirconscriptionDisplayName,
  slugify,
} from "@agora/shared";

const LIMIT_SCRUTINS = 20;
const LIMIT_DEPUTIES = 20;
const LIMIT_GROUPS = 10;

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
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const type = (
      typeof req.query.type === "string" ? req.query.type : "all"
    ) as SearchType;

    if (!q || q.length < 2) {
      throw new ApiError(
        400,
        "Query parameter 'q' is required and must be at least 2 characters",
        "BadRequest",
      );
    }

    const validTypes: SearchType[] = ["scrutins", "deputies", "groups", "all"];
    if (!validTypes.includes(type)) {
      throw new ApiError(
        400,
        "Parameter 'type' must be one of: scrutins, deputies, groups, all",
        "BadRequest",
      );
    }

    const pattern = `%${q}%`;
    const response: SearchResponse = {
      q,
      scrutins: [],
      deputies: [],
      groups: [],
    };

    if (type === "scrutins" || type === "all") {
      const { data: scrutins, error } = await supabase
        .from("scrutins")
        .select("*")
        .ilike("titre", pattern)
        .order("date_scrutin", { ascending: false })
        .limit(LIMIT_SCRUTINS);

      if (error) {
        console.error("Search scrutins error:", error);
        throw new ApiError(500, "Search failed", "DatabaseError");
      }

      response.scrutins = (scrutins || []).map((row: DbScrutin) => ({
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
      }));
    }

    if (type === "deputies" || type === "all") {
      const { data: deputies, error } = await supabase
        .from("deputies")
        .select("*")
        .or(`civil_nom.ilike.${pattern},civil_prenom.ilike.${pattern}`)
        .limit(LIMIT_DEPUTIES);

      if (error) {
        console.error("Search deputies error:", error);
        throw new ApiError(500, "Search failed", "DatabaseError");
      }

      type DeputyRow = Deputy & {
        ref_circonscription?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      response.deputies = (deputies || []).map((row: DeputyRow) => ({
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
          getCirconscriptionDisplayName(row.circonscription) ??
          row.circonscription,
        circonscription_ref: row.ref_circonscription ?? null,
        departement: row.departement,
        date_debut_mandat: row.date_debut_mandat,
        date_fin_mandat: row.date_fin_mandat ?? null,
        legislature: row.legislature,
        official_url: row.official_url,
      }));
    }

    if (type === "groups" || type === "all") {
      const { data: rows, error } = await supabase
        .from("deputies")
        .select("groupe_politique")
        .not("groupe_politique", "is", null)
        .ilike("groupe_politique", pattern);

      if (error) {
        console.error("Search groups error:", error);
        throw new ApiError(500, "Search failed", "DatabaseError");
      }

      const byLabel = new Map<string, number>();
      for (const row of rows ?? []) {
        const label = (row.groupe_politique ?? "").trim();
        if (!label) continue;
        byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
      }

      const groups: PoliticalGroupSummary[] = Array.from(byLabel.entries())
        .map(([label, deputy_count]) => ({
          slug: slugify(label),
          label,
          deputy_count,
        }))
        .sort((a, b) => b.deputy_count - a.deputy_count)
        .slice(0, LIMIT_GROUPS);

      response.groups = groups;
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
