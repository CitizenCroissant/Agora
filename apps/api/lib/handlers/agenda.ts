/**
 * GET /api/agenda?date=YYYY-MM-DD
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, getLastIngestionDate } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import { DbSitting, DbAgendaItem, DbSourceMetadata } from "../types";
import { SittingWithItems } from "@agora/shared";

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
    const { date } = req.query;
    if (!date || typeof date !== "string") {
      throw new ApiError(400, "Date parameter is required", "BadRequest");
    }
    if (!validateDateFormat(date)) {
      throw new ApiError(
        400,
        "Invalid date format. Use YYYY-MM-DD",
        "BadRequest"
      );
    }

    const { data: sittings, error: sittingsError } = await supabase
      .from("sittings")
      .select("*")
      .eq("date", date)
      .order("start_time", { ascending: true, nullsFirst: false });

    if (sittingsError) {
      console.error("Supabase error:", sittingsError);
      throw new ApiError(500, "Failed to fetch sittings", "DatabaseError");
    }

    if (!sittings || sittings.length === 0) {
      const lastSync = await getLastIngestionDate();
      return res.status(200).json({
        date,
        sittings: [],
        source: {
          label: "Données officielles de l'Assemblée nationale",
          last_updated_at: lastSync ?? new Date().toISOString()
        }
      });
    }

    const sittingIds = sittings.map((s: DbSitting) => s.id);
    const { data: agendaItems, error: itemsError } = await supabase
      .from("agenda_items")
      .select("*")
      .in("sitting_id", sittingIds)
      .order("scheduled_time", { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error("Supabase error:", itemsError);
      throw new ApiError(500, "Failed to fetch agenda items", "DatabaseError");
    }

    const { data: sourceMetadata } = await supabase
      .from("source_metadata")
      .select("*")
      .in("sitting_id", sittingIds);

    const itemsBySitting = (agendaItems || []).reduce(
      (acc: Record<string, DbAgendaItem[]>, item: DbAgendaItem) => {
        if (!acc[item.sitting_id]) acc[item.sitting_id] = [];
        acc[item.sitting_id].push(item);
        return acc;
      },
      {}
    );

    const sittingsWithItems: SittingWithItems[] = sittings.map(
      (sitting: DbSitting) => {
        const items = itemsBySitting[sitting.id] || [];
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
          start_time: sitting.start_time || undefined,
          end_time: sitting.end_time || undefined,
          type: sitting.type,
          title: sitting.title,
          description: sitting.description,
          location: sitting.location || undefined,
          time_range: timeRange,
          agenda_items: items.map((item: DbAgendaItem) => ({
            id: item.id,
            sitting_id: item.sitting_id,
            scheduled_time: item.scheduled_time || undefined,
            title: item.title,
            description: item.description,
            category: item.category,
            reference_code: item.reference_code || undefined,
            official_url: item.official_url || undefined
          }))
        };
      }
    );

    let lastUpdatedIso: string;
    if (sourceMetadata && sourceMetadata.length > 0) {
      const lastUpdated = Math.max(
        ...sourceMetadata.map((m: DbSourceMetadata) =>
          new Date(m.last_synced_at).getTime()
        )
      );
      lastUpdatedIso = new Date(lastUpdated).toISOString();
    } else {
      lastUpdatedIso =
        (await getLastIngestionDate()) ?? new Date().toISOString();
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({
      date,
      sittings: sittingsWithItems,
      source: {
        label: "Données officielles de l'Assemblée nationale",
        last_updated_at: lastUpdatedIso
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
}
