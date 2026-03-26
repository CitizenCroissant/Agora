/**
 * GET /api/deputies/[acteurRef]/attendance-heatmap
 * Returns daily aggregated attendance + voting activity for a deputy,
 * normalized into GitHub-style heatmap cells with a civic participation score.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError, validateDateFormat } from "../errors";
import { DeputyAttendanceHeatmapCell } from "@agora/shared";
import {
  computeScoreAndStatus,
  DailyAttendanceRow
} from "../attendance-scoring";

const DEFAULT_DAYS = 365;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
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
    const acteurRef = ((req as any).pathParams?.acteurRef ??
      req.query?.acteurRef ??
      (req as { params?: { acteurRef?: string } }).params?.acteurRef) as
      | string
      | undefined;

    if (!acteurRef || typeof acteurRef !== "string") {
      throw new ApiError(400, "acteurRef is required", "BadRequest");
    }

    const fromParam = (req.query?.from as string | undefined) ?? undefined;
    const toParam = (req.query?.to as string | undefined) ?? undefined;

    let from = fromParam;
    let to = toParam;

    if (from && !validateDateFormat(from)) {
      throw new ApiError(
        400,
        "Invalid from date format (expected YYYY-MM-DD)",
        "BadRequest"
      );
    }
    if (to && !validateDateFormat(to)) {
      throw new ApiError(
        400,
        "Invalid to date format (expected YYYY-MM-DD)",
        "BadRequest"
      );
    }

    // Default range: last 365 days ending today
    if (!from || !to) {
      const today = new Date();
      const end = today.toISOString().split("T")[0];
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (DEFAULT_DAYS - 1));
      const start = startDate.toISOString().split("T")[0];
      from = from ?? start;
      to = to ?? end;
    }

    if (from > to) {
      throw new ApiError(400, "from must be <= to", "BadRequest");
    }

    const { data, error } = await supabase
      .from("deputy_daily_attendance")
      .select(
        "acteur_ref, date, total_sittings, attended_sittings, total_votes, participated_votes, has_excused_absence, parliament_open"
      )
      .eq("acteur_ref", acteurRef)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error (deputy_daily_attendance):", error);
      throw new ApiError(
        500,
        "Failed to fetch deputy daily attendance",
        "DatabaseError"
      );
    }

    const rows = (data ?? []) as DailyAttendanceRow[];

    const cells: DeputyAttendanceHeatmapCell[] = rows.map((row) => {
      const { score, status } = computeScoreAndStatus(row);
      return {
        date: row.date,
        score: Math.round(score),
        status,
        totalSittings: row.total_sittings,
        attendedSittings: row.attended_sittings,
        totalVotes: row.total_votes,
        participatedVotes: row.participated_votes,
        hasExcusedAbsence: row.has_excused_absence,
        parliamentOpen: row.parliament_open
      };
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(cells);
  } catch (error) {
    handleError(res, error);
  }
}

