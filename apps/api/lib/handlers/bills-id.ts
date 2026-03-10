/**
 * GET /api/bills/[id]
 * Returns bill detail with related scrutins.
 * id can be UUID or official_id (dossier reference).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type {
  BillDetailResponse,
  BillAmendsBill,
  BillAmendmentsSummary,
  BillTextWithCount,
  Scrutin,
  ThematicTag,
  SittingWithItems
} from "@agora/shared";
import type { DbBill, DbBillScrutin, DbScrutin, DbSitting } from "../types";

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

    // Fetch sittings for timeline (lifecycle): sittings where these scrutins took place
    const sittingIds = [
      ...new Set(
        scrutins.map((s) => s.sitting_id).filter((id): id is string => id != null)
      )
    ];
    let sittings: SittingWithItems[] = [];
    if (sittingIds.length > 0) {
      const { data: sittingRows, error: sittingsError } = await supabase
        .from("sittings")
        .select("id, official_id, date, start_time, end_time, type, title, description, location, organe_ref")
        .in("id", sittingIds)
        .order("date", { ascending: true });

      if (!sittingsError && sittingRows && sittingRows.length > 0) {
        sittings = (sittingRows as DbSitting[]).map((row) => ({
          id: row.id,
          official_id: row.official_id,
          date: row.date,
          start_time: row.start_time ?? undefined,
          end_time: row.end_time ?? undefined,
          type: row.type,
          title: row.title,
          description: row.description,
          location: row.location ?? undefined,
          organe_ref: row.organe_ref ?? undefined,
          agenda_items: []
        }));
      }
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

    let amends_bill: BillAmendsBill | null = null;
    if (bill.amends_bill_id) {
      const { data: parentRow } = await supabase
        .from("bills")
        .select("id, official_id, title, short_title")
        .eq("id", bill.amends_bill_id)
        .maybeSingle();
      if (parentRow) {
        amends_bill = {
          id: parentRow.id,
          official_id: parentRow.official_id,
          title: parentRow.title,
          short_title: parentRow.short_title ?? undefined
        };
      }
    }

    // Bill textes (document versions) with amendment count per texte
    const { data: billTextRows } = await supabase
      .from("bill_texts")
      .select("id, texte_ref, numero, label, official_url")
      .eq("bill_id", bill.id)
      .order("texte_ref", { ascending: true });
    const billTextsList = (billTextRows ?? []) as Array<{
      id: string;
      texte_ref: string;
      numero: string | null;
      label: string | null;
      official_url: string | null;
    }>;
    const billTextIds = billTextsList.map((r) => r.id);

    // Amendment counts per bill_text_id (one query: get all then count in JS)
    const countByBillTextId = new Map<string, number>();
    billTextIds.forEach((id) => countByBillTextId.set(id, 0));
    if (billTextIds.length > 0) {
      const pageSize = 1000;
      for (let off = 0; ; off += pageSize) {
        const { data: amRows } = await supabase
          .from("amendments")
          .select("bill_text_id")
          .in("bill_text_id", billTextIds)
          .range(off, off + pageSize - 1);
        if (!amRows || amRows.length === 0) break;
        (amRows as { bill_text_id: string }[]).forEach((row) => {
          countByBillTextId.set(
            row.bill_text_id,
            (countByBillTextId.get(row.bill_text_id) ?? 0) + 1
          );
        });
        if (amRows.length < pageSize) break;
      }
    }

    const textes: BillTextWithCount[] = billTextsList.map((row) => ({
      id: row.id,
      texte_ref: row.texte_ref,
      numero: row.numero ?? undefined,
      label: row.label ?? undefined,
      official_url: row.official_url ?? undefined,
      amendments_count: countByBillTextId.get(row.id) ?? 0
    }));

    // Synthetic amendments summary (counts only; amendments are per texte, we aggregate across bill's textes)
    let amendments_summary: BillAmendmentsSummary | null = null;
    const amendmentsTotal = textes.reduce((s, t) => s + t.amendments_count, 0);
    if (amendmentsTotal > 0) {
      const votedAmendmentIds = new Set<string>();
      const batchSize = 1000;
      for (let offset = 0; offset < amendmentsTotal; offset += batchSize) {
        const { data: amendmentRows } = await supabase
          .from("amendments")
          .select("id")
          .in("bill_text_id", billTextIds)
          .range(offset, offset + batchSize - 1);
        const ids = (amendmentRows ?? []).map((r: { id: string }) => r.id);
        if (ids.length === 0) break;
        const { data: linked } = await supabase
          .from("scrutin_amendments")
          .select("amendment_id")
          .in("amendment_id", ids);
        (linked ?? []).forEach((row: { amendment_id: string }) =>
          votedAmendmentIds.add(row.amendment_id)
        );
      }
      amendments_summary = {
        total: amendmentsTotal,
        with_scrutin_count: votedAmendmentIds.size
      };
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
      scrutins,
      sittings: sittings.length > 0 ? sittings : undefined,
      amends_bill: amends_bill ?? undefined,
      amendments_summary: amendments_summary ?? undefined,
      textes: textes.length > 0 ? textes : undefined
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

