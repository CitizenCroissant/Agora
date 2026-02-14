/**
 * GET /api/deputies/[acteurRef]/attendance
 * Returns commission reunion attendance for a deputy (présent / absent / excusé).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { DeputyAttendanceResponse } from "@agora/shared";

const MAX_ATTENDANCE = 50;

/** Normalize title: if stored as JSON array string, use first item or fallback */
function normalizeSittingTitle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  if (!raw.startsWith("[")) return raw.trim() || "";
  try {
    const arr = JSON.parse(raw) as unknown[];
    const first = Array.isArray(arr) ? arr[0] : null;
    return typeof first === "string" ? first.trim() : "";
  } catch {
    return "";
  }
}

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

    const { data: attendanceRows, error: attError } = await supabase
      .from("sitting_attendance")
      .select("sitting_id, presence")
      .eq("acteur_ref", acteurRef);

    if (attError) {
      console.error("Supabase error (sitting_attendance):", attError);
      throw new ApiError(500, "Failed to fetch attendance", "DatabaseError");
    }

    const { data: deputy } = await supabase
      .from("deputies")
      .select("civil_nom, civil_prenom")
      .eq("acteur_ref", acteurRef)
      .maybeSingle();
    const acteurNom = deputy
      ? `${deputy.civil_prenom} ${deputy.civil_nom}`.trim()
      : null;

    if (!attendanceRows || attendanceRows.length === 0) {
      const response: DeputyAttendanceResponse = {
        acteur_ref: acteurRef,
        acteur_nom: acteurNom ?? undefined,
        attendance: []
      };
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      res.status(200).json(response);
      return;
    }

    const sittingIds = [
      ...new Set(
        (attendanceRows as { sitting_id: string }[]).map((r) => r.sitting_id)
      )
    ];
    const { data: sittings, error: sitError } = await supabase
      .from("sittings")
      .select("id, title, date")
      .in("id", sittingIds);

    if (sitError || !sittings) {
      console.error("Supabase error (sittings):", sitError);
      throw new ApiError(500, "Failed to fetch sittings", "DatabaseError");
    }

    const sittingsById = new Map(
      (sittings as { id: string; title: string; date: string }[]).map((s) => [
        s.id,
        {
          title: normalizeSittingTitle(s.title) || "Réunion de commission",
          date: s.date
        }
      ])
    );

    const attendance = (attendanceRows as { sitting_id: string; presence: string }[])
      .map((r) => {
        const s = sittingsById.get(r.sitting_id);
        return {
          sitting_id: r.sitting_id,
          sitting_title: s?.title ?? "Réunion de commission",
          date: s?.date ?? "",
          presence: r.presence as "présent" | "absent" | "excusé"
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_ATTENDANCE);

    const response: DeputyAttendanceResponse = {
      acteur_ref: acteurRef,
      acteur_nom: acteurNom ?? undefined,
      attendance
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
}
