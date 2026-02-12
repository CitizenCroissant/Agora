/**
 * GET /api/bills
 * Returns list of legislative texts (bills) with basic summary information.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import type { BillSummary } from "@agora/shared";
import type { DbBill, DbBillScrutin, DbScrutin } from "../types";

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
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const type =
      typeof req.query.type === "string" ? req.query.type.trim() : undefined;
    const tag =
      typeof req.query.tag === "string" ? req.query.tag.trim() : undefined;
    const hasVotes = req.query.has_votes === "true";

    // If filtering by tag, first get the bill IDs that have this tag
    let tagFilteredBillIds: string[] | null = null;
    if (tag) {
      // First resolve the tag slug to a tag id
      const { data: tagRow, error: tagError } = await supabase
        .from("thematic_tags")
        .select("id")
        .eq("slug", tag)
        .maybeSingle();

      if (tagError) {
        throw new ApiError(500, "Failed to fetch tag", "DatabaseError");
      }

      if (!tagRow) {
        // Unknown tag slug → no results
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
        return res.status(200).json({ bills: [] });
      }

      const { data: billTagRows, error: billTagError } = await supabase
        .from("bill_thematic_tags")
        .select("bill_id")
        .eq("tag_id", tagRow.id);

      if (billTagError) {
        throw new ApiError(500, "Failed to fetch bill tags", "DatabaseError");
      }

      tagFilteredBillIds = (billTagRows ?? []).map(
        (bt: { bill_id: string }) => bt.bill_id
      );

      if (tagFilteredBillIds.length === 0) {
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
        return res.status(200).json({ bills: [] });
      }
    }

    let query = supabase.from("bills").select("*") as any;

    if (q && q.length >= 2) {
      const pattern = `%${q}%`;
      query = query.ilike("title", pattern);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (tagFilteredBillIds) {
      query = query.in("id", tagFilteredBillIds);
    }

    // When has_votes is requested, only return bills that have at least one scrutin link
    if (hasVotes) {
      const { data: linkedBillIds, error: linkedError } = await supabase
        .from("bill_scrutins")
        .select("bill_id");

      if (linkedError) {
        throw new ApiError(500, "Failed to fetch bill-scrutin links", "DatabaseError");
      }

      const uniqueBillIds = [
        ...new Set((linkedBillIds ?? []).map((r: { bill_id: string }) => r.bill_id))
      ];

      if (uniqueBillIds.length === 0) {
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
        return res.status(200).json({ bills: [] });
      }

      // Intersect with any existing tag filter
      if (tagFilteredBillIds) {
        const voteSet = new Set(uniqueBillIds);
        const intersected = tagFilteredBillIds.filter((id) => voteSet.has(id));
        if (intersected.length === 0) {
          res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
          return res.status(200).json({ bills: [] });
        }
        query = supabase.from("bills").select("*") as any;
        if (q && q.length >= 2) query = query.ilike("title", `%${q}%`);
        if (type) query = query.eq("type", type);
        query = query.in("id", intersected);
      } else {
        query = query.in("id", uniqueBillIds);
      }
    }

    // Order by official_id descending: the sequential number in the ID
    // (e.g. DLR5L17N53735) correlates with the dossier creation date.
    const { data: billRows, error: billError } = await (query as any)
      .order("official_id", { ascending: false })
      .limit(200);

    if (billError) {
      throw new ApiError(500, "Failed to fetch bills", "DatabaseError");
    }

    const bills: DbBill[] = (billRows ?? []) as DbBill[];

    if (bills.length === 0) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json({ bills: [] });
    }

    const billIds = bills.map((b) => b.id);

    const { data: links, error: linksError } = await supabase
      .from("bill_scrutins")
      .select("bill_id, scrutin_id, created_at")
      .in("bill_id", billIds);

    if (linksError) {
      throw new ApiError(
        500,
        "Failed to fetch bill-scrutin links",
        "DatabaseError"
      );
    }

    const linkRows: DbBillScrutin[] = (links ?? []) as DbBillScrutin[];
    const scrutinIds = [
      ...new Set(linkRows.map((l) => l.scrutin_id))
    ] as string[];

    let scrutinsById = new Map<string, DbScrutin>();
    if (scrutinIds.length > 0) {
      const { data: scrutins, error: scrutinsError } = await supabase
        .from("scrutins")
        .select("id, date_scrutin")
        .in("id", scrutinIds);

      if (scrutinsError) {
        throw new ApiError(500, "Failed to fetch scrutins", "DatabaseError");
      }

      scrutinsById = new Map(
        (scrutins ?? []).map(
          (s: { id: string; date_scrutin: string }) =>
            [s.id, s] as [string, DbScrutin]
        )
      );
    }

    const latestByBill = new Map<string, string | null>();
    const countByBill = new Map<string, number>();

    for (const link of linkRows) {
      const s = scrutinsById.get(link.scrutin_id);
      if (!s) continue;
      const prevDate = latestByBill.get(link.bill_id);
      if (!prevDate || s.date_scrutin > prevDate) {
        latestByBill.set(link.bill_id, s.date_scrutin);
      }
      countByBill.set(link.bill_id, (countByBill.get(link.bill_id) ?? 0) + 1);
    }

    const summaries: BillSummary[] = bills.map((b) => ({
      id: b.id,
      official_id: b.official_id,
      title: b.title,
      short_title: b.short_title,
      type: b.type ?? undefined,
      origin: b.origin ?? undefined,
      official_url: b.official_url ?? undefined,
      latest_scrutin_date: latestByBill.get(b.id) ?? null,
      scrutins_count: countByBill.get(b.id) ?? 0
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ bills: summaries });
  } catch (error) {
    return handleError(res, error);
  }
}
