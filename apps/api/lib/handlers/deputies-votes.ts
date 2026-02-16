/**
 * GET /api/deputies/[acteurRef]/votes
 * Returns voting record for a deputy (by acteur_ref, e.g. PA842279).
 * Query param: enrich=comparison — adds per-vote comparison (assembly result + deputy's group breakdown).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import {
  DeputyVotesResponse,
  DeputyVoteRecordWithComparison,
  DeputyVoteComparison
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

    const enrichComparison =
      (req.query?.enrich as string)?.toLowerCase() === "comparison";

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
      .select("civil_nom, civil_prenom, groupe_politique")
      .eq("acteur_ref", acteurRef)
      .maybeSingle();
    type DeputyRow = {
      civil_nom: string;
      civil_prenom: string;
      groupe_politique: string | null;
    };
    const d = deputy as DeputyRow | null;
    const acteurNom = d
      ? `${d.civil_prenom} ${d.civil_nom}`.trim()
      : null;
    const deputyGroup = enrichComparison && d?.groupe_politique
      ? d.groupe_politique.trim()
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
    type ScrutinRow = {
      id: string;
      titre: string;
      date_scrutin: string;
      sort_code: string | null;
    };
    const SCRUTIN_IDS_CHUNK = 80;
    const scrutinsRows: ScrutinRow[] = [];
    for (let i = 0; i < scrutinIds.length; i += SCRUTIN_IDS_CHUNK) {
      const chunk = scrutinIds.slice(i, i + SCRUTIN_IDS_CHUNK);
      const { data: chunkData, error: scrutinsError } = await supabase
        .from("scrutins")
        .select("id, titre, date_scrutin, sort_code")
        .in("id", chunk);
      if (scrutinsError) {
        console.error("Supabase error (scrutins):", scrutinsError);
        throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
      }
      scrutinsRows.push(...((chunkData ?? []) as ScrutinRow[]));
    }
    const scrutinsById = new Map(
      scrutinsRows.map((s) => [
        s.id,
        {
          titre: s.titre,
          date_scrutin: s.date_scrutin,
          sort_code: s.sort_code ?? null
        }
      ])
    );

    type GroupStats = {
      pour: number;
      contre: number;
      abstention: number;
      non_votant: number;
      total: number;
    };
    const groupStatsByScrutin = new Map<
      string,
      Map<string, GroupStats>
    >();

    if (enrichComparison && deputyGroup && scrutinIds.length > 0) {
      type VoteRow = { scrutin_id: string; acteur_ref: string; position: string };
      const allVotes: VoteRow[] = [];
      for (let i = 0; i < scrutinIds.length; i += SCRUTIN_IDS_CHUNK) {
        const chunk = scrutinIds.slice(i, i + SCRUTIN_IDS_CHUNK);
        const { data: chunkVotes, error: allVotesError } = await supabase
          .from("scrutin_votes")
          .select("scrutin_id, acteur_ref, position")
          .in("scrutin_id", chunk);
        if (allVotesError) {
          console.error("Supabase error (scrutin_votes for comparison):", allVotesError);
          break;
        }
        allVotes.push(...((chunkVotes ?? []) as VoteRow[]));
      }
      if (allVotes.length > 0) {
        const acteurRefs = [...new Set(allVotes.map((r) => r.acteur_ref))];
        const acteurToGroup = new Map<string, string | null>();
        const DEPUTY_REFS_CHUNK = 150;
        for (let i = 0; i < acteurRefs.length; i += DEPUTY_REFS_CHUNK) {
          const refChunk = acteurRefs.slice(i, i + DEPUTY_REFS_CHUNK);
          const { data: deputiesList } = await supabase
            .from("deputies")
            .select("acteur_ref, groupe_politique")
            .in("acteur_ref", refChunk);
          (deputiesList || []).forEach(
            (d: { acteur_ref: string; groupe_politique: string | null }) => {
              acteurToGroup.set(
                d.acteur_ref,
                d.groupe_politique ? d.groupe_politique.trim() : null
              );
            }
          );
        }

        for (const v of allVotes) {
          const groupLabel = acteurToGroup.get(v.acteur_ref);
          if (!groupLabel) continue;
          if (!groupStatsByScrutin.has(v.scrutin_id)) {
            groupStatsByScrutin.set(
              v.scrutin_id,
              new Map<string, GroupStats>()
            );
          }
          const byGroup = groupStatsByScrutin.get(v.scrutin_id)!;
          if (!byGroup.has(groupLabel)) {
            byGroup.set(groupLabel, {
              pour: 0,
              contre: 0,
              abstention: 0,
              non_votant: 0,
              total: 0
            });
          }
          const stats = byGroup.get(groupLabel)!;
          stats.total += 1;
          if (v.position === "pour") stats.pour += 1;
          else if (v.position === "contre") stats.contre += 1;
          else if (v.position === "abstention") stats.abstention += 1;
          else if (v.position === "non_votant") stats.non_votant += 1;
        }
      }
    }

    const buildComparison = (
      scrutinId: string,
      groupLabel: string
    ): DeputyVoteComparison | null => {
      const scrut = scrutinsById.get(scrutinId);
      const sortCode = scrut?.sort_code;
      if (!sortCode || sortCode !== "adopté") {
        if (sortCode !== "rejeté") return null;
      }
      const byGroup = groupStatsByScrutin.get(scrutinId);
      if (!byGroup) return null;
      const stats = byGroup.get(groupLabel);
      if (!stats || stats.total === 0) return null;
      const denom = stats.total;
      const pct = (n: number) =>
        Math.round((n * 10000) / denom) / 100;
      return {
        assembly_result: sortCode as "adopté" | "rejeté",
        group_label: groupLabel,
        group_pour_pct: pct(stats.pour),
        group_contre_pct: pct(stats.contre),
        group_abstention_pct: pct(stats.abstention),
        group_non_votant_pct: pct(stats.non_votant)
      };
    };

    const voteRecords: DeputyVoteRecordWithComparison[] = votes.map(
      (v: { scrutin_id: string; position: string }) => {
        const s = scrutinsById.get(v.scrutin_id);
        const base = {
          scrutin_id: v.scrutin_id,
          scrutin_titre: s?.titre ?? "",
          date_scrutin: s?.date_scrutin ?? "",
          position: v.position as
            | "pour"
            | "contre"
            | "abstention"
            | "non_votant"
        };
        if (enrichComparison && deputyGroup) {
          const comparison = buildComparison(v.scrutin_id, deputyGroup);
          return { ...base, comparison: comparison ?? undefined };
        }
        return base;
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
