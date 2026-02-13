/**
 * GET /api/scrutins/[id]
 * Returns a single scrutin by UUID or official_id, with optional votes
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { DbScrutin, DbScrutinVote, DbBill } from "../types";
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
      status: 405
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = ((req as any).pathParams?.id ??
      req.query?.id ??
      (req as any).params?.id) as string;

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
      ...new Set((votes || []).map((v: DbScrutinVote) => v.acteur_ref))
    ];
    const acteurNomMap = new Map<string, string>();
    const acteurGroupMap = new Map<string, string | null>();
    if (acteurRefs.length > 0) {
      const { data: deputies } = await supabase
        .from("deputies")
        .select("acteur_ref, civil_nom, civil_prenom, groupe_politique")
        .in("acteur_ref", acteurRefs);
      (deputies || []).forEach(
        (d: {
          acteur_ref: string;
          civil_nom: string;
          civil_prenom: string;
          groupe_politique: string | null;
        }) => {
          acteurNomMap.set(
            d.acteur_ref,
            `${d.civil_prenom} ${d.civil_nom}`.trim()
          );
          acteurGroupMap.set(
            d.acteur_ref,
            d.groupe_politique ? d.groupe_politique.trim() : null
          );
        }
      );
    }

    // Fetch tags for this scrutin
    const { data: scrutinTags, error: tagsError } = await supabase
      .from("scrutin_thematic_tags")
      .select("tag_id")
      .eq("scrutin_id", scrutin.id);

    let tags: Array<{ id: string; slug: string; label: string }> = [];

    if (tagsError) {
      console.error(`[${scrutin.id}] Error fetching tags:`, tagsError);
    } else if (scrutinTags && scrutinTags.length > 0) {
      // Fetch tag details separately
      const tagIds = scrutinTags.map((st) => st.tag_id);
      const { data: tagDetails, error: tagDetailsError } = await supabase
        .from("thematic_tags")
        .select("id, slug, label")
        .in("id", tagIds);

      if (tagDetailsError) {
        console.error(`[${scrutin.id}] Error fetching tag details:`, tagDetailsError);
      } else if (tagDetails) {
        tags = tagDetails.map((tag) => ({
          id: tag.id,
          slug: tag.slug,
          label: tag.label
        }));
      }
    }

    const dbScrutin = scrutin as DbScrutin;

    // Compute per-political-group vote breakdown for this scrutin
    const groupVoteMap = new Map<
      string,
      {
        pour: number;
        contre: number;
        abstention: number;
        non_votant: number;
        total: number;
      }
    >();

    for (const v of votes || []) {
      const groupLabel = acteurGroupMap.get(v.acteur_ref);
      if (!groupLabel) continue;
      if (!groupVoteMap.has(groupLabel)) {
        groupVoteMap.set(groupLabel, {
          pour: 0,
          contre: 0,
          abstention: 0,
          non_votant: 0,
          total: 0
        });
      }
      const stats = groupVoteMap.get(groupLabel)!;
      stats.total += 1;
      if (v.position === "pour") stats.pour += 1;
      else if (v.position === "contre") stats.contre += 1;
      else if (v.position === "abstention") stats.abstention += 1;
      else if (v.position === "non_votant") stats.non_votant += 1;
    }

    const groupVotes = Array.from(groupVoteMap.entries())
      .map(([label, stats]) => {
        const denom = stats.total || 1;
        const pct = (count: number) =>
          Math.round((count * 10000) / denom) / 100; // 2 decimal places
        return {
          groupe_politique: label,
          total: stats.total,
          pour: stats.pour,
          contre: stats.contre,
          abstention: stats.abstention,
          non_votant: stats.non_votant,
          pour_pct: pct(stats.pour),
          contre_pct: pct(stats.contre),
          abstention_pct: pct(stats.abstention),
          non_votant_pct: pct(stats.non_votant)
        };
      })
      // Sort by total descending to show largest groups first
      .sort((a, b) => b.total - a.total);
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
      objet_libelle: dbScrutin.objet_libelle ?? null,
      demandeur_texte: dbScrutin.demandeur_texte ?? null,
      votes: (votes || []).map((v: DbScrutinVote) => ({
        id: v.id,
        scrutin_id: v.scrutin_id,
        acteur_ref: v.acteur_ref,
        position: v.position as "pour" | "contre" | "abstention" | "non_votant",
        acteur_nom: acteurNomMap.get(v.acteur_ref) ?? null
      })),
      tags: tags || [],
      group_votes: groupVotes
    };

    // Optional linked bill (dossier législatif) for this scrutin.
    const { data: billLinks, error: billLinksError } = await supabase
      .from("bill_scrutins")
      .select("bill_id")
      .eq("scrutin_id", dbScrutin.id)
      .limit(1);

    if (billLinksError) {
      console.error(
        "Error fetching bill_scrutins for scrutin",
        dbScrutin.id,
        billLinksError
      );
    } else if (billLinks && billLinks.length > 0) {
      const billId = (billLinks[0] as { bill_id: string }).bill_id;
      const { data: billRow, error: billError } = await supabase
        .from("bills")
        .select("id, official_id, title, short_title")
        .eq("id", billId)
        .maybeSingle();
      if (billError) {
        console.error("Error fetching bill", billId, billError);
      } else if (billRow) {
        const bill = billRow as DbBill;
        (response as unknown as { bill?: ScrutinDetailResponse["bill"] }).bill =
          {
            id: bill.id,
            official_id: bill.official_id,
            title: bill.title,
            short_title: bill.short_title
          };
      }
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
