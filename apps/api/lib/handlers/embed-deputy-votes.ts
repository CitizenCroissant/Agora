/**
 * GET /api/embed/deputy/[acteurRef]/votes
 * Returns last N votes for a deputy (embed-friendly: no comparison, small payload).
 * Query param: limit (default 5, max 20).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type { DeputyVotesResponse, DeputyVoteRecord } from "@agora/shared";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function parseLimit(queryLimit: unknown): number {
  if (queryLimit == null) return DEFAULT_LIMIT;
  const n = parseInt(String(queryLimit), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
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
    const acteurRef = ((req as { pathParams?: { acteurRef?: string } }).pathParams
      ?.acteurRef ?? req.query?.acteurRef) as string | undefined;

    if (!acteurRef || typeof acteurRef !== "string") {
      throw new ApiError(400, "acteurRef is required", "BadRequest");
    }

    const limit = parseLimit(req.query?.limit);

    const { data: votes, error: votesError } = await supabase
      .from("scrutin_votes")
      .select("scrutin_id, position")
      .eq("acteur_ref", acteurRef)
      .order("scrutin_id", { ascending: false })
      .limit(limit);

    if (votesError) {
      console.error("Supabase error:", votesError);
      throw new ApiError(500, "Failed to fetch deputy votes", "DatabaseError");
    }

    const { data: deputy } = await supabase
      .from("deputies")
      .select("civil_nom, civil_prenom")
      .eq("acteur_ref", acteurRef)
      .maybeSingle();

    type DeputyRow = { civil_nom: string; civil_prenom: string };
    const d = deputy as DeputyRow | null;
    const acteurNom = d
      ? `${(d.civil_prenom ?? "").trim()} ${(d.civil_nom ?? "").trim()}`.trim()
      : null;

    if (!votes || votes.length === 0) {
      const response: DeputyVotesResponse = {
        acteur_ref: acteurRef,
        acteur_nom: acteurNom ?? undefined,
        votes: []
      };
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json(response);
    }

    const scrutinIds = [...new Set(votes.map((v) => v.scrutin_id))];
    const { data: scrutinsRows, error: scrutinsError } = await supabase
      .from("scrutins")
      .select("id, titre, date_scrutin")
      .in("id", scrutinIds);

    if (scrutinsError) {
      console.error("Supabase error (scrutins):", scrutinsError);
      throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
    }

    type ScrutinRow = { id: string; titre: string; date_scrutin: string };
    const scrutinsById = new Map(
      (scrutinsRows ?? []).map((s: ScrutinRow) => [
        s.id,
        { titre: s.titre, date_scrutin: s.date_scrutin }
      ])
    );

    const voteRecords: DeputyVoteRecord[] = votes.map(
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

    voteRecords.sort((a, b) => b.date_scrutin.localeCompare(a.date_scrutin));

    const response: DeputyVotesResponse = {
      acteur_ref: acteurRef,
      acteur_nom: acteurNom ?? undefined,
      votes: voteRecords
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
