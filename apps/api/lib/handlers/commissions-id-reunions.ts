/**
 * GET /api/commissions/:id/reunions?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Sittings (reunions) for one organe. Optional date range.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import type { SittingWithItems } from "@agora/shared";
import type { DbSitting, DbAgendaItem } from "../types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405
    });
  }

  try {
    const id = (req as any).pathParams?.id ?? req.query?.id;
    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Commission id is required", "BadRequest");
    }

    let query = supabase
      .from("sittings")
      .select("*")
      .eq("organe_ref", id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false });

    const from = req.query?.from;
    const to = req.query?.to;
    if (from && typeof from === "string" && validateDateFormat(from)) {
      query = query.gte("date", from);
    }
    if (to && typeof to === "string" && validateDateFormat(to)) {
      query = query.lte("date", to);
    }

    const { data: sittings, error: sittingsError } = await query;

    if (sittingsError) {
      console.error("Supabase error:", sittingsError);
      throw new ApiError(500, "Failed to fetch reunions", "DatabaseError");
    }

    if (!sittings || sittings.length === 0) {
      return res.status(200).json({ organe_ref: id, reunions: [] });
    }

    const sittingIds = (sittings as DbSitting[]).map((s) => s.id);
    const { data: agendaItems, error: itemsError } = await supabase
      .from("agenda_items")
      .select("*")
      .in("sitting_id", sittingIds)
      .order("scheduled_time", { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error("Supabase error:", itemsError);
    }

    const itemsBySitting = (agendaItems ?? []).reduce(
      (acc: Record<string, DbAgendaItem[]>, item: DbAgendaItem) => {
        if (!acc[item.sitting_id]) acc[item.sitting_id] = [];
        acc[item.sitting_id].push(item);
        return acc;
      },
      {}
    );

    const reunions: SittingWithItems[] = (sittings as DbSitting[]).map(
      (sitting: DbSitting) => {
        const items = itemsBySitting[sitting.id] ?? [];
        const timeRange =
          sitting.start_time && sitting.end_time
            ? `${sitting.start_time.substring(0, 5)} - ${sitting.end_time.substring(0, 5)}`
            : sitting.start_time
              ? sitting.start_time.substring(0, 5)
              : undefined;
        return {
          id: sitting.id,
          official_id: sitting.official_id,
          date: sitting.date,
          start_time: sitting.start_time ?? undefined,
          end_time: sitting.end_time ?? undefined,
          type: sitting.type,
          title: sitting.title,
          description: sitting.description,
          location: sitting.location ?? undefined,
          organe_ref: sitting.organe_ref ?? undefined,
          time_range: timeRange,
          agenda_items: items.map((item: DbAgendaItem) => ({
            id: item.id,
            sitting_id: item.sitting_id,
            scheduled_time: item.scheduled_time ?? undefined,
            title: item.title,
            description: item.description,
            category: item.category,
            reference_code: item.reference_code ?? undefined,
            official_url: item.official_url ?? undefined
          }))
        };
      }
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ organe_ref: id, reunions });
  } catch (e) {
    return handleError(res, e);
  }
}
