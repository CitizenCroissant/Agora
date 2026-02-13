/**
 * GET /api/commissions/:id/members
 * Currently sitting members (deputies) of one organe. From deputy_organes + deputies.
 * Only deputies with no date_fin_mandat or date_fin_mandat >= today are returned.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CommissionMemberRow {
  acteur_ref: string;
  civil_nom: string | null;
  civil_prenom: string | null;
  groupe_politique: string | null;
}

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

    const { data: links, error: linksError } = await supabase
      .from("deputy_organes")
      .select("acteur_ref")
      .eq("organe_ref", id);

    if (linksError) {
      console.error("Supabase error (deputy_organes):", linksError);
      throw new ApiError(500, "Failed to fetch commission members", "DatabaseError");
    }

    if (!links || links.length === 0) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json({ organe_ref: id, members: [] });
    }

    const acteurRefs = [...new Set((links as { acteur_ref: string }[]).map((r) => r.acteur_ref))];
    const today = getTodayDate();

    const { data: deputies, error: deputiesError } = await supabase
      .from("deputies")
      .select("acteur_ref, civil_nom, civil_prenom, groupe_politique")
      .in("acteur_ref", acteurRefs)
      .or(`date_fin_mandat.is.null,date_fin_mandat.gte.${today}`)
      .order("civil_nom", { ascending: true, nullsFirst: false })
      .order("civil_prenom", { ascending: true, nullsFirst: false });

    if (deputiesError) {
      console.error("Supabase error (deputies):", deputiesError);
      throw new ApiError(500, "Failed to fetch deputies", "DatabaseError");
    }

    const members = (deputies ?? []).map((d: CommissionMemberRow) => ({
      acteur_ref: d.acteur_ref,
      civil_nom: d.civil_nom ?? null,
      civil_prenom: d.civil_prenom ?? null,
      groupe_politique: d.groupe_politique ?? null
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({ organe_ref: id, members });
  } catch (e) {
    return handleError(res, e);
  }
}
