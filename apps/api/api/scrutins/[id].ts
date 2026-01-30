/**
 * GET /api/scrutins/[id]
 * Returns a single scrutin by UUID or official_id, with optional votes
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { ApiError, handleError } from "../../lib/errors";
import { DbScrutin, DbScrutinVote } from "../../lib/types";
import { ScrutinDetailResponse } from "@agora/shared";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
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
    const id = (req.query.id || (req as any).params?.id) as string;

    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Scrutin ID is required", "BadRequest");
    }

    const filter = isUuid(id)
      ? { column: "id", value: id }
      : { column: "official_id", value: id };

    const { data: scrutin, error: scrutError } = await supabase
      .from("scrutins")
      .select("*")
      .eq(filter.column, filter.value)
      .single();

    if (scrutError || !scrutin) {
      if (scrutError?.code === "PGRST116") {
        throw new ApiError(404, "Scrutin not found", "NotFound");
      }
      throw new ApiError(500, "Failed to fetch scrutin", "DatabaseError");
    }

    const { data: votes, error: votesError } = await supabase
      .from("scrutin_votes")
      .select("*")
      .eq("scrutin_id", scrutin.id)
      .order("position", { ascending: true })
      .order("acteur_ref", { ascending: true });

    if (votesError) {
      console.error("Supabase error (votes):", votesError);
      // Non-critical: return scrutin without votes
    }

    // Enrich votes with deputy names from deputies table
    const acteurRefs = [
      ...new Set((votes || []).map((v: DbScrutinVote) => v.acteur_ref)),
    ];
    const acteurNomMap = new Map<string, string>();
    if (acteurRefs.length > 0) {
      const { data: deputies } = await supabase
        .from("deputies")
        .select("acteur_ref, civil_nom, civil_prenom")
        .in("acteur_ref", acteurRefs);
      (deputies || []).forEach(
        (d: {
          acteur_ref: string;
          civil_nom: string;
          civil_prenom: string;
        }) => {
          acteurNomMap.set(
            d.acteur_ref,
            `${d.civil_prenom} ${d.civil_nom}`.trim(),
          );
        },
      );
    }

    const dbScrutin = scrutin as DbScrutin;
    const response: ScrutinDetailResponse = {
      id: dbScrutin.id,
      official_id: dbScrutin.official_id,
      sitting_id: dbScrutin.sitting_id,
      date_scrutin: dbScrutin.date_scrutin,
      numero: dbScrutin.numero,
      type_vote_code: dbScrutin.type_vote_code,
      type_vote_libelle: dbScrutin.type_vote_libelle,
      sort_code: dbScrutin.sort_code,
      sort_libelle: dbScrutin.sort_libelle,
      titre: dbScrutin.titre,
      synthese_pour: dbScrutin.synthese_pour,
      synthese_contre: dbScrutin.synthese_contre,
      synthese_abstentions: dbScrutin.synthese_abstentions,
      synthese_non_votants: dbScrutin.synthese_non_votants,
      official_url: dbScrutin.official_url,
      votes: (votes || []).map((v: DbScrutinVote) => ({
        id: v.id,
        scrutin_id: v.scrutin_id,
        acteur_ref: v.acteur_ref,
        position: v.position as "pour" | "contre" | "abstention" | "non_votant",
        acteur_nom: acteurNomMap.get(v.acteur_ref) ?? null,
      })),
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
