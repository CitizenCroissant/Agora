/**
 * GET /api/groups
 * Returns list of political groups (groupes politiques) with slug, label and deputy count
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { slugify, isCurrentlySitting } from "@agora/shared";
import type { PoliticalGroupSummary } from "@agora/shared";

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
    const { data: rows, error } = await supabase
      .from("deputies")
      .select("groupe_politique, date_fin_mandat")
      .not("groupe_politique", "is", null)
      .limit(10000);

    if (error) {
      throw new ApiError(500, "Failed to fetch groups", "DatabaseError");
    }

    // Count only deputies whose mandate is still active (same logic as isCurrentlySitting)
    const byLabel = new Map<string, number>();
    for (const row of rows ?? []) {
      if (!isCurrentlySitting(row.date_fin_mandat ?? null)) continue;
      const label = (row.groupe_politique ?? "").trim();
      if (!label) continue;
      byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
    }

    const groups: PoliticalGroupSummary[] = Array.from(byLabel.entries())
      .map(([label, deputy_count]) => ({
        slug: slugify(label),
        label,
        deputy_count
      }))
      .sort((a, b) => b.deputy_count - a.deputy_count);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ groups });
  } catch (error) {
    return handleError(res, error);
  }
}
