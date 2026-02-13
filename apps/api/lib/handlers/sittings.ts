/**
 * GET /api/sittings/[id]
 * Returns detailed information for a specific sitting
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { DbSitting, DbAgendaItem, DbSourceMetadata, DbScrutin, DbSittingAttendance } from "../types";
import { SittingDetailResponse, Organe } from "@agora/shared";

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
    // pathParams: set by route.ts (dev + serverless); query/params: Vercel/Express
     
    const rawId =
      (req as any).pathParams?.id ?? req.query?.id ?? (req as any).params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Sitting ID is required", "BadRequest");
    }

    // Fetch sitting
    const { data: sitting, error: sittingError } = await supabase
      .from("sittings")
      .select("*")
      .eq("id", id)
      .single();

    if (sittingError) {
      console.error("Supabase error:", sittingError);
      if (sittingError.code === "PGRST116") {
        throw new ApiError(404, "Sitting not found", "NotFound");
      }
      throw new ApiError(500, "Failed to fetch sitting", "DatabaseError");
    }

    // Fetch agenda items
    const { data: agendaItems, error: itemsError } = await supabase
      .from("agenda_items")
      .select("*")
      .eq("sitting_id", id)
      .order("scheduled_time", { ascending: true, nullsFirst: false });

    if (itemsError) {
      console.error("Supabase error:", itemsError);
      throw new ApiError(500, "Failed to fetch agenda items", "DatabaseError");
    }

    // Fetch source metadata
    const { data: sourceMetadata, error: metadataError } = await supabase
      .from("source_metadata")
      .select("*")
      .eq("sitting_id", id)
      .single();

    if (metadataError && metadataError.code !== "PGRST116") {
      console.error("Supabase error:", metadataError);
      // Non-critical error, continue without metadata
    }

    // Fetch scrutins for this sitting
    const { data: scrutins, error: scrutinsError } = await supabase
      .from("scrutins")
      .select("*")
      .eq("sitting_id", id)
      .order("numero", { ascending: true });

    if (scrutinsError) {
      console.error("Supabase error (scrutins):", scrutinsError);
      // Non-critical error, continue without scrutins
    }

    // Fetch attendance (commission reunions only)
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("sitting_attendance")
      .select("acteur_ref, presence")
      .eq("sitting_id", id)
      .order("acteur_ref", { ascending: true });

    if (attendanceError) {
      console.error("Supabase error (sitting_attendance):", attendanceError);
      // Non-critical error, continue without attendance
    }

    // Resolve deputy names for attendance
    let attendanceWithNames: Array<{ acteur_ref: string; presence: "présent" | "absent" | "excusé"; acteur_nom?: string | null }> = [];
    if (attendanceRows && attendanceRows.length > 0) {
      const acteurRefs = [...new Set((attendanceRows as DbSittingAttendance[]).map((r) => r.acteur_ref))];
      const acteurNomMap = new Map<string, string>();
      const { data: deputies } = await supabase
        .from("deputies")
        .select("acteur_ref, civil_nom, civil_prenom")
        .in("acteur_ref", acteurRefs);
      (deputies || []).forEach(
        (d: { acteur_ref: string; civil_nom: string; civil_prenom: string }) => {
          acteurNomMap.set(d.acteur_ref, `${d.civil_prenom} ${d.civil_nom}`.trim());
        }
      );
      attendanceWithNames = (attendanceRows as DbSittingAttendance[]).map((row) => ({
        acteur_ref: row.acteur_ref,
        presence: row.presence as "présent" | "absent" | "excusé",
        acteur_nom: acteurNomMap.get(row.acteur_ref) ?? null
      }));
    }

    const dbSitting = sitting as DbSitting;

    // Fetch organe (commission) name when sitting has organe_ref
    let organe: Organe | null = null;
    if (dbSitting.organe_ref) {
      const { data: organeRow } = await supabase
        .from("organes")
        .select("id, libelle, libelle_abrege, type_organe, official_url")
        .eq("id", dbSitting.organe_ref)
        .single();
      if (organeRow) {
        organe = {
          id: organeRow.id,
          libelle: organeRow.libelle ?? null,
          libelle_abrege: organeRow.libelle_abrege ?? null,
          type_organe: organeRow.type_organe,
          official_url: organeRow.official_url ?? null
        };
      }
    }

    const timeRange =
      dbSitting.start_time && dbSitting.end_time
        ? `${dbSitting.start_time.substring(0, 5)} - ${dbSitting.end_time.substring(0, 5)}`
        : dbSitting.start_time
          ? dbSitting.start_time.substring(0, 5)
          : undefined;

    const response: SittingDetailResponse = {
      id: dbSitting.id,
      official_id: dbSitting.official_id,
      date: dbSitting.date,
      start_time: dbSitting.start_time || undefined,
      end_time: dbSitting.end_time || undefined,
      type: dbSitting.type,
      title: dbSitting.title,
      description: dbSitting.description,
      location: dbSitting.location || undefined,
      organe_ref: dbSitting.organe_ref ?? undefined,
      organe: organe ?? undefined,
      time_range: timeRange,
      agenda_items: (agendaItems || []).map((item: DbAgendaItem) => ({
        id: item.id,
        sitting_id: item.sitting_id,
        scheduled_time: item.scheduled_time || undefined,
        title: item.title,
        description: item.description,
        category: item.category,
        reference_code: item.reference_code || undefined,
        official_url: item.official_url || undefined
      })),
      source_metadata: sourceMetadata
        ? {
            id: (sourceMetadata as DbSourceMetadata).id,
            sitting_id: (sourceMetadata as DbSourceMetadata).sitting_id,
            original_source_url: (sourceMetadata as DbSourceMetadata)
              .original_source_url,
            last_synced_at: (sourceMetadata as DbSourceMetadata).last_synced_at,
            checksum: (sourceMetadata as DbSourceMetadata).checksum
          }
        : {
            id: "",
            sitting_id: id,
            original_source_url: "",
            last_synced_at: new Date().toISOString(),
            checksum: ""
          },
      scrutins: (scrutins || []).map((row: DbScrutin) => ({
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
        official_url: row.official_url
      })),
      attendance:
        attendanceWithNames.length > 0 ? attendanceWithNames : undefined
    };

    // Set cache headers (cache for 5 minutes)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
