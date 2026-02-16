/**
 * GET /api/agenda/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns agenda for a date range
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, getLastIngestionDate } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import { DbSitting, DbAgendaItem, DbSourceMetadata } from "../types";
import {
  AgendaRangeResponse,
  AgendaResponse,
  SittingWithItems,
  Organe
} from "@agora/shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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
    const { from, to } = req.query;

    if (!from || typeof from !== "string") {
      throw new ApiError(400, "From date parameter is required", "BadRequest");
    }

    if (!to || typeof to !== "string") {
      throw new ApiError(400, "To date parameter is required", "BadRequest");
    }

    if (!validateDateFormat(from) || !validateDateFormat(to)) {
      throw new ApiError(
        400,
        "Invalid date format. Use YYYY-MM-DD",
        "BadRequest"
      );
    }

    if (new Date(from) > new Date(to)) {
      throw new ApiError(
        400,
        "From date must be before or equal to to date",
        "BadRequest"
      );
    }

    // Fetch sittings for the date range
    let rangeQuery = supabase
      .from("sittings")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false });

    const typeFilter = req.query?.type;
    if (typeFilter === "seance" || typeFilter === "seance_type") {
      rangeQuery = rangeQuery.eq("type", "seance_type");
    } else if (typeFilter === "commission" || typeFilter === "reunionCommission_type") {
      rangeQuery = rangeQuery.eq("type", "reunionCommission_type");
    }

    const { data: sittings, error: sittingsError } = await rangeQuery;

    if (sittingsError) {
      console.error("Supabase error:", sittingsError);
      throw new ApiError(500, "Failed to fetch sittings", "DatabaseError");
    }

    if (!sittings || sittings.length === 0) {
      const response: AgendaRangeResponse = {
        from,
        to,
        agendas: []
      };
      return res.status(200).json(response);
    }

    // Fetch agenda items for all sittings
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

    // Fetch source metadata
    const { data: sourceMetadata, error: metadataError } = await supabase
      .from("source_metadata")
      .select("*")
      .in("sitting_id", sittingIds);

    if (metadataError) {
      console.error("Supabase error:", metadataError);
      // Non-critical error, continue without metadata
    }

    // Group by date
    const sittingsByDate = sittings.reduce(
      (acc: Record<string, DbSitting[]>, sitting: DbSitting) => {
        if (!acc[sitting.date]) {
          acc[sitting.date] = [];
        }
        acc[sitting.date].push(sitting);
        return acc;
      },
      {}
    );

    // Group agenda items by sitting
    const itemsBySitting = (agendaItems || []).reduce(
      (acc: Record<string, DbAgendaItem[]>, item: DbAgendaItem) => {
        if (!acc[item.sitting_id]) {
          acc[item.sitting_id] = [];
        }
        acc[item.sitting_id].push(item);
        return acc;
      },
      {}
    );

    // Fetch organes for sittings that have organe_ref
    const organeRefs = [
      ...new Set(
        (sittings as DbSitting[])
          .map((s) => s.organe_ref?.trim())
          .filter((ref): ref is string => !!ref)
      )
    ];
    let organeByRef: Record<string, Organe> = {};
    if (organeRefs.length > 0) {
      const { data: organeRows } = await supabase
        .from("organes")
        .select("id, libelle, libelle_abrege, type_organe, official_url")
        .in("id", organeRefs);
      if (organeRows) {
        organeByRef = organeRows.reduce(
          (acc: Record<string, Organe>, r: { id: string; libelle: string | null; libelle_abrege: string | null; type_organe: string; official_url: string | null }) => {
            acc[r.id] = {
              id: r.id,
              libelle: r.libelle ?? null,
              libelle_abrege: r.libelle_abrege ?? null,
              type_organe: r.type_organe,
              official_url: r.official_url ?? null
            };
            return acc;
          },
          {}
        );
      }
    }

    // Group source metadata by sitting
    const metadataBySitting = (sourceMetadata || []).reduce(
      (acc: Record<string, DbSourceMetadata>, meta: DbSourceMetadata) => {
        acc[meta.sitting_id] = meta;
        return acc;
      },
      {}
    );

    // Fallback date: last known ingestion (fetched once, used if per-sitting metadata is missing)
    const fallbackLastSync = await getLastIngestionDate();

    // Build response for each date
    const agendas: AgendaResponse[] = Object.keys(sittingsByDate)
      .sort()
      .map((date) => {
        const dateSittings = sittingsByDate[date];
        const sittingsWithItems: SittingWithItems[] = dateSittings.map(
          (sitting: DbSitting) => {
            const items = itemsBySitting[sitting.id] || [];
            const timeRange =
              sitting.start_time && sitting.end_time
                ? `${sitting.start_time.substring(0, 5)} - ${sitting.end_time.substring(0, 5)}`
                : sitting.start_time
                  ? sitting.start_time.substring(0, 5)
                  : undefined;
            const organeRef = sitting.organe_ref?.trim();
            const organe = organeRef ? organeByRef[organeRef] ?? undefined : undefined;

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
              organe_ref: sitting.organe_ref ?? undefined,
              organe: organe ?? undefined,
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

        // Get latest sync time for this date
        const dateMetadata = dateSittings
          .map((s: DbSitting) => metadataBySitting[s.id])
          .filter(Boolean);
        let lastUpdatedIso: string;
        if (dateMetadata.length > 0) {
          const lastUpdated = Math.max(
            ...dateMetadata.map((m: DbSourceMetadata) =>
              new Date(m.last_synced_at).getTime()
            )
          );
          lastUpdatedIso = new Date(lastUpdated).toISOString();
        } else {
          lastUpdatedIso = fallbackLastSync ?? new Date().toISOString();
        }

        return {
          date,
          sittings: sittingsWithItems,
          source: {
            label: "Données officielles de l'Assemblée nationale",
            last_updated_at: lastUpdatedIso
          }
        };
      });

    const response: AgendaRangeResponse = {
      from,
      to,
      agendas
    };

    // Set cache headers (cache for 5 minutes)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
