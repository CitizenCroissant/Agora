/**
 * GET /api/deputies/[acteurRef]/votes
 * Returns voting record for a deputy (by acteur_ref, e.g. PA842279)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { DeputyVotesResponse } from "@agora/shared";

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
    const acteurRef = ((req as any).pathParams?.acteurRef ??
      req.query?.acteurRef ??
      (req as { params?: { acteurRef?: string } }).params?.acteurRef) as
      | string
      | undefined;

    if (!acteurRef || typeof acteurRef !== "string") {
      throw new ApiError(400, "acteurRef is required", "BadRequest");
    }

    const { data: votes, error: votesError } = await supabase
      .from("scrutin_votes")
      .select("scrutin_id, position")
      .eq("acteur_ref", acteurRef)
      .order("scrutin_id", { ascending: false });

    if (votesError) {
      console.error("Supabase error:", votesError);
      throw new ApiError(500, "Failed to fetch deputy votes", "DatabaseError");
    }

    const { data: deputy } = await supabase
      .from("deputies")
      .select("civil_nom, civil_prenom")
      .eq("acteur_ref", acteurRef)
      .maybeSingle();
    const acteurNom = deputy
      ? `${deputy.civil_prenom} ${deputy.civil_nom}`.trim()
      : null;

    if (!votes || votes.length === 0) {
      const response: DeputyVotesResponse = {
        acteur_ref: acteurRef,
        acteur_nom: acteurNom,
        votes: []
      };
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json(response);
    }

    const scrutinIds = [...new Set(votes.map((v) => v.scrutin_id))];
    const { data: scrutins, error: scrutinsError } = await supabase
      .from("scrutins")
      .select("id, titre, date_scrutin")
      .in("id", scrutinIds);

    if (scrutinsError || !scrutins) {
      console.error("Supabase error (scrutins):", scrutinsError);
      throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
    }

    const scrutinsById = new Map(
      scrutins.map((s: { id: string; titre: string; date_scrutin: string }) => [
        s.id,
        { titre: s.titre, date_scrutin: s.date_scrutin }
      ])
    );

    const voteRecords = votes.map(
      (v: { scrutin_id: string; position: string }) => {
        const s = scrutinsById.get(v.scrutin_id);
        return {
          scrutin_id: v.scrutin_id,
          scrutin_titre: s?.titre ?? "",
          date_scrutin: s?.date_scrutin ?? "",
          position: v.position as
            | "pour"
            | "contre"
            | "abstention"
            | "non_votant"
        };
      }
    );

    // Sort by date descending
    voteRecords.sort((a, b) => b.date_scrutin.localeCompare(a.date_scrutin));

    const response: DeputyVotesResponse = {
      acteur_ref: acteurRef,
      acteur_nom: acteurNom,
      votes: voteRecords
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
