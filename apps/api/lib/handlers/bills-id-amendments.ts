/**
 * GET /api/bills/[id]/amendments
 * Returns paginated list of amendments for a bill, with optional scrutin links.
 * id can be UUID or official_id (dossier reference).
 * Query: limit (default 50, max 100), offset (default 0), bill_text_id (optional – filter by text version).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type {
  BillAmendmentsListResponse,
  AmendmentListItem,
  AmendmentScrutinRef
} from "@agora/shared";
import type { DbBill, DbScrutin } from "../types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405
    });
    return;
  }

  try {
    const id =
      (req as { pathParams?: { id?: string } }).pathParams?.id ??
      (req.query?.id as string);

    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Bill id is required", "BadRequest");
    }

    const filter = isUuid(id)
      ? { column: "id" as const, value: id }
      : { column: "official_id" as const, value: id };

    const { data: billRow, error: billError } = await supabase
      .from("bills")
      .select("id, official_id, title, short_title")
      .eq(filter.column, filter.value)
      .maybeSingle();

    if (billError) {
      throw new ApiError(500, "Failed to fetch bill", "DatabaseError");
    }
    if (!billRow) {
      throw new ApiError(404, "Bill not found", "NotFound");
    }

    const bill = billRow as DbBill;

    const { data: billTextRows } = await supabase
      .from("bill_texts")
      .select("id")
      .eq("bill_id", bill.id);
    const billTextIds = (billTextRows ?? []).map((r: { id: string }) => r.id);

    const billTextIdParam = req.query?.bill_text_id;
    const effectiveBillTextIds: string[] =
      typeof billTextIdParam === "string" &&
      billTextIdParam.length > 0 &&
      billTextIds.includes(billTextIdParam)
        ? [billTextIdParam]
        : billTextIds;

    if (effectiveBillTextIds.length === 0) {
      const response: BillAmendmentsListResponse = {
        bill: {
          id: bill.id,
          official_id: bill.official_id,
          title: bill.title,
          short_title: bill.short_title ?? undefined
        },
        amendments: [],
        total: 0,
        limit: DEFAULT_LIMIT,
        offset: 0,
        has_more: false
      };
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json(response);
    }

    let limit = DEFAULT_LIMIT;
    const limitParam = req.query?.limit;
    if (limitParam !== undefined) {
      const n = Number(limitParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_LIMIT) limit = n;
    }

    let offset = 0;
    const offsetParam = req.query?.offset;
    if (offsetParam !== undefined) {
      const n = Number(offsetParam);
      if (Number.isInteger(n) && n >= 0) offset = n;
    }

    const { count: total, error: countError } = await supabase
      .from("amendments")
      .select("*", { count: "exact", head: true })
      .in("bill_text_id", effectiveBillTextIds);

    if (countError) {
      throw new ApiError(500, "Failed to count amendments", "DatabaseError");
    }

    const totalCount = total ?? 0;

    if (totalCount === 0) {
      const response: BillAmendmentsListResponse = {
        bill: {
          id: bill.id,
          official_id: bill.official_id,
          title: bill.title,
          short_title: bill.short_title ?? undefined
        },
        amendments: [],
        total: 0,
        limit,
        offset,
        has_more: false
      };
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json(response);
    }

    // Single page: order and sort in the DB (numero_sort, then numero)
    type AmendmentRow = {
      id: string;
      official_id: string;
      numero: string;
      official_url: string | null;
    };
    const { data: amendmentRows, error: amendmentsError } = await supabase
      .from("amendments")
      .select("id, official_id, numero, official_url")
      .in("bill_text_id", effectiveBillTextIds)
      .order("numero_sort", { ascending: true, nullsFirst: false })
      .order("numero", { ascending: true })
      .range(offset, offset + limit - 1);

    if (amendmentsError) {
      throw new ApiError(500, "Failed to fetch amendments", "DatabaseError");
    }

    const amendments = (amendmentRows ?? []) as AmendmentRow[];
    const amendmentIds = amendments.map((a) => a.id);

    const { data: linkRows } = await supabase
      .from("scrutin_amendments")
      .select("amendment_id, scrutin_id")
      .in("amendment_id", amendmentIds);

    const links = (linkRows ?? []) as Array<{
      amendment_id: string;
      scrutin_id: string;
    }>;

    const scrutinIds = [...new Set(links.map((l) => l.scrutin_id))];
    const scrutinsMap: Record<string, AmendmentScrutinRef> = {};

    if (scrutinIds.length > 0) {
      const { data: scrutinRows, error: scrutinsError } = await supabase
        .from("scrutins")
        .select("id, date_scrutin, titre, sort_code, official_url")
        .in("id", scrutinIds);

      if (!scrutinsError && scrutinRows?.length) {
        (scrutinRows as DbScrutin[]).forEach((row) => {
          scrutinsMap[row.id] = {
            id: row.id,
            date_scrutin: row.date_scrutin,
            titre: row.titre,
            sort_code: row.sort_code,
            official_url: row.official_url ?? null
          };
        });
      }
    }

    const scrutinsByAmendment: Record<string, AmendmentScrutinRef[]> = {};
    amendmentIds.forEach((aid) => {
      scrutinsByAmendment[aid] = [];
    });
    links.forEach((l) => {
      const ref = scrutinsMap[l.scrutin_id];
      if (ref && scrutinsByAmendment[l.amendment_id]) {
        scrutinsByAmendment[l.amendment_id].push(ref);
      }
    });

    const amendmentList: AmendmentListItem[] = amendments.map((a) => ({
      id: a.id,
      official_id: a.official_id,
      numero: a.numero,
      official_url: a.official_url,
      scrutins:
        scrutinsByAmendment[a.id]?.length > 0
          ? scrutinsByAmendment[a.id]
          : undefined
    }));

    const response: BillAmendmentsListResponse = {
      bill: {
        id: bill.id,
        official_id: bill.official_id,
        title: bill.title,
        short_title: bill.short_title ?? undefined
      },
      amendments: amendmentList,
      total: totalCount,
      limit,
      offset,
      has_more: offset + amendmentList.length < totalCount
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
}
