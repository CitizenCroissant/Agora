/**
 * GET /api/scrutins?from=YYYY-MM-DD&to=YYYY-MM-DD&group=slug&group_position=pour|contre|abstention
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import { DbScrutin } from "../types";
import { ScrutinsResponse, slugify } from "@agora/shared";

const VALID_GROUP_POSITIONS = ["pour", "contre", "abstention"] as const;

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
    const { from, to, group, group_position } = req.query;
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

    const groupSlug = typeof group === "string" ? group.trim() : null;
    const position =
      typeof group_position === "string" && VALID_GROUP_POSITIONS.includes(group_position as (typeof VALID_GROUP_POSITIONS)[number])
        ? (group_position as (typeof VALID_GROUP_POSITIONS)[number])
        : null;

    let scrutinIds: string[] | null = null;
    if (groupSlug) {
      const { data: groupRows, error: groupError } = await supabase
        .from("deputies")
        .select("groupe_politique")
        .not("groupe_politique", "is", null)
        .limit(10000);

      if (groupError) {
        console.error("Supabase deputies error:", groupError);
        throw new ApiError(500, "Failed to resolve group", "DatabaseError");
      }

      const groupePolitique = (groupRows ?? [])
        .map((r) => (r.groupe_politique ?? "").trim())
        .filter(Boolean)
        .find((label) => slugify(label) === groupSlug);

      if (!groupePolitique) {
        return res.status(200).json({
          from,
          to,
          scrutins: [],
          source: {
            label: "Assemblée nationale - Scrutins",
            last_updated_at: undefined,
          },
        });
      }

      const { data: idRows, error: rpcError } = await supabase.rpc("get_scrutin_ids_by_group", {
        p_from: from,
        p_to: to,
        p_groupe_politique: groupePolitique,
        p_position: position,
      });

      if (rpcError) {
        console.error("get_scrutin_ids_by_group RPC error:", rpcError);
        throw new ApiError(500, "Failed to filter scrutins by group", "DatabaseError");
      }

      const idsFromRpc = (idRows ?? []).map((row: { id: string }) => row.id).filter(Boolean);
      scrutinIds = idsFromRpc;
      if (idsFromRpc.length === 0) {
        return res.status(200).json({
          from,
          to,
          scrutins: [],
          source: { label: "Assemblée nationale - Scrutins", last_updated_at: undefined },
        });
      }
    }

    let query = supabase
      .from("scrutins")
      .select("*")
      .gte("date_scrutin", from)
      .lte("date_scrutin", to)
      .order("date_scrutin", { ascending: false })
      .order("numero", { ascending: false });

    const ids = scrutinIds;
    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    }

    const { data: scrutins, error } = await query;

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
