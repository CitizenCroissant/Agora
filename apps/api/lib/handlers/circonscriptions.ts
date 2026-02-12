/**
 * GET /api/circonscriptions
 * Returns list of circonscriptions (electoral constituencies) from circonscriptions table with deputy count
 * Counts deputies the same way as detail: by ref_circonscription OR by circonscription label (fallback).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { getCirconscriptionLabelsForId } from "@agora/shared";
import type {
  CirconscriptionSummary,
  CirconscriptionsListResponse
} from "@agora/shared";

const todayIso = () => new Date().toISOString().split("T")[0];

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
    const { data: circoRows, error: circoError } = await supabase
      .from("circonscriptions")
      .select("id, label")
      .order("label", { ascending: true })
      .limit(1000);

    if (circoError) {
      throw new ApiError(
        500,
        "Failed to fetch circonscriptions",
        "DatabaseError"
      );
    }

    const today = todayIso();
    const { data: deputyRows, error: deputyError } = await supabase
      .from("deputies")
      .select("ref_circonscription, circonscription")
      .or(`date_fin_mandat.is.null,date_fin_mandat.gte.${today}`);

    if (deputyError) {
      throw new ApiError(500, "Failed to fetch deputy counts", "DatabaseError");
    }

    // Build label -> circonscription id (for deputies that have circonscription text but ref mismatch)
    const labelToId = new Map<string, string>();
    for (const c of circoRows ?? []) {
      for (const lbl of getCirconscriptionLabelsForId(c.id)) {
        labelToId.set(lbl, c.id);
      }
    }
    const circoIds = new Set((circoRows ?? []).map((r) => r.id));

    // Count deputies per circonscription id (same logic as detail: ref match OR label match)
    const countById = new Map<string, number>();
    for (const row of deputyRows ?? []) {
      const ref = (row.ref_circonscription ?? "").trim();
      const label = (row.circonscription ?? "").trim();
      const matchedId =
        (ref && circoIds.has(ref) ? ref : null) ??
        (label ? (labelToId.get(label) ?? null) : null);
      if (matchedId) {
        countById.set(matchedId, (countById.get(matchedId) ?? 0) + 1);
      }
    }

    // Return all circonscriptions from official source; deputy_count may be 0
    const circonscriptions: CirconscriptionSummary[] = (circoRows ?? []).map(
      (c) => ({
        id: c.id,
        label: c.label ?? c.id,
        deputy_count: countById.get(c.id) ?? 0
      })
    );

    const response: CirconscriptionsListResponse = { circonscriptions };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}
