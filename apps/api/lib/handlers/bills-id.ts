/**
 * GET /api/bills/[id]
 * Returns bill detail with related scrutins.
 * id can be UUID or official_id (dossier reference).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type { BillDetailResponse, Scrutin, ThematicTag } from "@agora/shared";
import type { DbBill, DbBillScrutin, DbScrutin } from "../types";

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
      throw new ApiError(400, "Bill id is required", "BadRequest");
    }

    const filter = isUuid(id)
      ? { column: "id", value: id }
      : { column: "official_id", value: id };

    const { data: billRow, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq(filter.column, filter.value)
      .maybeSingle();

    if (billError) {
      throw new ApiError(500, "Failed to fetch bill", "DatabaseError");
    }
    if (!billRow) {
      throw new ApiError(404, "Bill not found", "NotFound");
    }

    const bill = billRow as DbBill;

    const { data: links, error: linksError } = await supabase
      .from("bill_scrutins")
      .select("bill_id, scrutin_id, role, created_at")
      .eq("bill_id", bill.id);

    if (linksError) {
      throw new ApiError(
        500,
        "Failed to fetch related scrutins",
        "DatabaseError"
      );
    }

    const linkRows: DbBillScrutin[] = (links ?? []) as DbBillScrutin[];
    const scrutinIds = [
      ...new Set(linkRows.map((l) => l.scrutin_id))
    ] as string[];

    let scrutins: Scrutin[] = [];
    if (scrutinIds.length > 0) {
      const { data: scrutinsRows, error: scrutinsError } = await supabase
        .from("scrutins")
        .select("*")
        .in("id", scrutinIds)
        .order("date_scrutin", { ascending: false })
        .order("numero", { ascending: false });

      if (scrutinsError) {
        throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
      }

      scrutins = (scrutinsRows ?? []).map((row: DbScrutin) => ({
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
        objet_libelle: row.objet_libelle ?? null,
        demandeur_texte: row.demandeur_texte ?? null,
        // tags are not joined here; tag them via separate endpoint if needed
        tags: []
      }));
    }

    // Fetch tags for this bill
    const { data: billTags, error: tagsError } = await supabase
      .from("bill_thematic_tags")
      .select("tag_id")
      .eq("bill_id", bill.id);

    let tags: ThematicTag[] = [];

    if (tagsError) {
      console.error(`[${bill.id}] Error fetching bill tags:`, tagsError);
    } else if (billTags && billTags.length > 0) {
      const tagIds = billTags.map((bt: { tag_id: string }) => bt.tag_id);
      const { data: tagDetails, error: tagDetailsError } = await supabase
        .from("thematic_tags")
        .select("id, slug, label")
        .in("id", tagIds);

      if (tagDetailsError) {
        console.error(`[${bill.id}] Error fetching tag details:`, tagDetailsError);
      } else if (tagDetails) {
        tags = tagDetails.map((tag: { id: string; slug: string; label: string }) => ({
          id: tag.id,
          slug: tag.slug,
          label: tag.label
        }));
      }
    }

    const response: BillDetailResponse = {
      id: bill.id,
      official_id: bill.official_id,
      title: bill.title,
      short_title: bill.short_title,
      type: bill.type ?? undefined,
      origin: bill.origin ?? undefined,
      official_url: bill.official_url ?? undefined,
      tags,
      scrutins
      // sittings can be derived client-side from scrutins.sitting_id if needed
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

