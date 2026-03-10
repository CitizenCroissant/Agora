/**
 * POST /api/digest/subscribe
 * Subscribe to the weekly "My deputy this week" email digest.
 * Body: { email: string, departement?: string, acteur_ref?: string }
 * Exactly one of departement or acteur_ref is required.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";
import { getCanonicalDepartementName, getDepartementQueryValues } from "@agora/shared";
import { isCurrentlySitting } from "@agora/shared";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length > 0 && EMAIL_REGEX.test(email.trim());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only POST is allowed",
      status: 405
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const email = (body.email as string)?.trim();
    const departement = (body.departement as string)?.trim() || null;
    const acteurRef = (body.acteur_ref as string)?.trim() || null;

    if (!email || !isValidEmail(email)) {
      throw new ApiError(400, "Valid email is required", "BadRequest");
    }

    const hasDepartement = departement != null && departement.length > 0;
    const hasActeurRef = acteurRef != null && acteurRef.length > 0;

    if (hasDepartement && hasActeurRef) {
      throw new ApiError(400, "Provide either departement or acteur_ref, not both", "BadRequest");
    }
    if (!hasDepartement && !hasActeurRef) {
      throw new ApiError(400, "Either departement or acteur_ref is required", "BadRequest");
    }

    let resolvedDepartement: string | null = null;
    let resolvedActeurRef: string | null = null;

    if (hasActeurRef) {
      const { data: deputy, error: depError } = await supabase
        .from("deputies")
        .select("acteur_ref")
        .eq("acteur_ref", acteurRef)
        .maybeSingle();
      if (depError || !deputy) {
        throw new ApiError(404, "Deputy not found", "NotFound");
      }
      resolvedActeurRef = (deputy as { acteur_ref: string }).acteur_ref;
    } else {
      const canonical = getCanonicalDepartementName(departement!);
      const queryValues = canonical ? getDepartementQueryValues(canonical) : [departement!];
      const { data: deputies, error: depError } = await supabase
        .from("deputies")
        .select("acteur_ref, date_fin_mandat")
        .in("departement", queryValues)
        .order("civil_nom", { ascending: true });
      if (depError) {
        throw new ApiError(500, "Failed to resolve department", "DatabaseError");
      }
      const current = (deputies ?? []).find(
        (d: { date_fin_mandat: string | null }) => isCurrentlySitting(d.date_fin_mandat)
      ) as { acteur_ref: string } | undefined;
      if (!current) {
        throw new ApiError(404, "No current deputy found for this department", "NotFound");
      }
      resolvedDepartement = canonical ?? departement;
    }

    const emailLower = email.toLowerCase();
    if (resolvedActeurRef) {
      const { data: existing } = await supabase
        .from("digest_subscriptions")
        .select("id")
        .eq("email", emailLower)
        .eq("acteur_ref", resolvedActeurRef)
        .limit(1)
        .maybeSingle();
      if (existing) {
        return res.status(200).json({
          ok: true,
          message: "Already subscribed to this digest",
          subscription_id: (existing as { id: string }).id
        });
      }
    } else {
      const { data: existing } = await supabase
        .from("digest_subscriptions")
        .select("id")
        .eq("email", emailLower)
        .eq("departement", resolvedDepartement)
        .limit(1)
        .maybeSingle();
      if (existing) {
        return res.status(200).json({
          ok: true,
          message: "Already subscribed to this digest",
          subscription_id: (existing as { id: string }).id
        });
      }
    }

    const { data: row, error: insertError } = await supabase
      .from("digest_subscriptions")
      .insert({
        email: emailLower,
        departement: resolvedDepartement,
        acteur_ref: resolvedActeurRef
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("digest subscribe insert error:", insertError);
      throw new ApiError(500, "Failed to create subscription", "DatabaseError");
    }

    const out = row as { id: string };
    res.status(201).json({
      ok: true,
      message: "Subscribed to the weekly digest",
      subscription_id: out.id
    });
  } catch (error) {
    return handleError(res, error);
  }
}
