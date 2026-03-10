/**
 * GET/POST /api/cron/digest-deputy-week
 * Weekly cron: send "My deputy this week" email digest to all subscribers.
 * Requires Authorization: Bearer CRON_SECRET (or PUSH_NOTIFY_SECRET).
 * Set RESEND_API_KEY and optionally RESEND_FROM (e.g. digest@yourdomain.com).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { supabase } from "../supabase";
import {
  getCanonicalDepartementName,
  getDepartementQueryValues
} from "@agora/shared";
import { isCurrentlySitting } from "@agora/shared";

const secret = process.env.CRON_SECRET ?? process.env.PUSH_NOTIFY_SECRET ?? "";

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}

function getBaseUrl(): string {
  const url = process.env.DIGEST_BASE_URL ?? process.env.VERCEL_URL;
  if (url) {
    return url.startsWith("http") ? url : `https://${url}`;
  }
  return "https://agora.vercel.app";
}

type ScrutinRow = {
  id: string;
  titre: string;
  date_scrutin: string;
  position: string;
};

function buildEmailHtml(
  deputyName: string,
  votes: ScrutinRow[],
  unsubscribeUrl: string
): string {
  const count = votes.length;
  const top3 = votes.slice(0, 3);
  const positionLabel = (p: string): string => {
    switch (p) {
      case "pour":
        return "Pour";
      case "contre":
        return "Contre";
      case "abstention":
        return "Abstention";
      case "non_votant":
        return "Non votant";
      default:
        return p;
    }
  };

  let body = `<p>Cette semaine, <strong>${escapeHtml(deputyName)}</strong> a participé à <strong>${count}</strong> scrutin${count !== 1 ? "s" : ""}.</p>`;
  if (top3.length > 0) {
    body += "<p><strong>À la une :</strong></p><ul>";
    for (const v of top3) {
      body += `<li><strong>${escapeHtml(v.titre)}</strong><br/>${v.date_scrutin} — ${positionLabel(v.position)}</li>`;
    }
    body += "</ul>";
  }
  body += `<p><a href="${escapeHtml(unsubscribeUrl)}">Se désinscrire de cette lettre</a></p>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Mon député cette semaine</title></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 1rem;">
  <h1>Mon député cette semaine</h1>
  ${body}
  <p style="color: #666; font-size: 0.875rem;">Agora — Transparence de l'Assemblée nationale</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET and POST are allowed",
      status: 405
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid authorization",
      status: 401
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "ConfigurationError",
      message: "RESEND_API_KEY is not set"
    });
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "Agora <onboarding@resend.dev>";
  const baseUrl = getBaseUrl();
  const { from: weekFrom, to: weekTo } = getWeekRange();

  try {
    const { data: subscriptions, error: subError } = await supabase
      .from("digest_subscriptions")
      .select("id, email, departement, acteur_ref, unsubscribe_token");

    if (subError) {
      console.error("digest cron: subscriptions error", subError);
      res.status(500).json({
        error: "DatabaseError",
        message: "Failed to fetch subscriptions"
      });
      return;
    }

    const list = (subscriptions ?? []) as Array<{
      id: string;
      email: string;
      departement: string | null;
      acteur_ref: string | null;
      unsubscribe_token: string;
    }>;

    let sent = 0;
    let failed = 0;

    for (const sub of list) {
      let acteurRef: string | null = sub.acteur_ref;

      if (!acteurRef && sub.departement) {
        const canonical = getCanonicalDepartementName(sub.departement);
        const queryValues = canonical
          ? getDepartementQueryValues(canonical)
          : [sub.departement];
        const { data: deputies } = await supabase
          .from("deputies")
          .select("acteur_ref, date_fin_mandat")
          .in("departement", queryValues)
          .order("civil_nom", { ascending: true });
        const current = (deputies ?? []).find(
          (d: { date_fin_mandat: string | null }) =>
            isCurrentlySitting(d.date_fin_mandat)
        ) as { acteur_ref: string } | undefined;
        acteurRef = current?.acteur_ref ?? null;
      }

      if (!acteurRef) {
        failed += 1;
        continue;
      }

      const { data: deputyRow } = await supabase
        .from("deputies")
        .select("civil_nom, civil_prenom")
        .eq("acteur_ref", acteurRef)
        .maybeSingle();
      const d = deputyRow as { civil_nom: string; civil_prenom: string } | null;
      const deputyName = d
        ? `${(d.civil_prenom ?? "").trim()} ${(d.civil_nom ?? "").trim()}`.trim()
        : "Votre député";

      const { data: votesData } = await supabase
        .from("scrutin_votes")
        .select("scrutin_id, position")
        .eq("acteur_ref", acteurRef);

      if (!votesData || votesData.length === 0) {
        continue;
      }

      const scrutinIds = [...new Set((votesData as { scrutin_id: string }[]).map((v) => v.scrutin_id))];
      const { data: scrutinsRows } = await supabase
        .from("scrutins")
        .select("id, titre, date_scrutin")
        .in("id", scrutinIds)
        .gte("date_scrutin", weekFrom)
        .lte("date_scrutin", weekTo);

      const votesByScrutin = new Map(
        (votesData as { scrutin_id: string; position: string }[]).map((v) => [
          v.scrutin_id,
          v.position
        ])
      );
      const scrutinsInRange = (scrutinsRows ?? []) as Array<{
        id: string;
        titre: string;
        date_scrutin: string;
      }>;
      const votes: ScrutinRow[] = scrutinsInRange.map((s) => ({
        id: s.id,
        titre: s.titre,
        date_scrutin: s.date_scrutin,
        position: votesByScrutin.get(s.id) ?? "non_votant"
      }));
      votes.sort((a, b) => b.date_scrutin.localeCompare(a.date_scrutin));

      const unsubscribeUrl = `${baseUrl}/api/digest/unsubscribe?token=${encodeURIComponent(sub.unsubscribe_token)}`;
      const html = buildEmailHtml(deputyName, votes, unsubscribeUrl);

      const { error: sendError } = await resend.emails.send({
        from,
        to: sub.email,
        subject: `Mon député cette semaine : ${deputyName}`,
        html
      });

      if (sendError) {
        console.error("digest send error", sub.email, sendError);
        failed += 1;
      } else {
        sent += 1;
      }
    }

    res.status(200).json({
      ok: true,
      message: "Digest run complete",
      week_from: weekFrom,
      week_to: weekTo,
      subscriptions: list.length,
      sent,
      failed
    });
  } catch (err) {
    console.error("digest-deputy-week error:", err);
    res.status(500).json({
      error: "InternalServerError",
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
