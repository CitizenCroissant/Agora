/**
 * POST /api/ingest
 * Serverless function for scheduled ingestion
 * Protected by secret key
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { ingest } from "../src/ingest";
import {
  logStart,
  logSuccess,
  logError,
  detectTrigger
} from "../src/ingestion-logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check authorization first (cron sends GET; we allow GET only when authorized by CRON_SECRET)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const ingestionSecret = process.env.INGESTION_SECRET;

  if (!cronSecret && !ingestionSecret) {
    console.error("CRON_SECRET or INGESTION_SECRET must be configured");
    return res.status(500).json({
      error: "ConfigurationError",
      message: "Ingestion endpoint not properly configured"
    });
  }

  // Vercel cron sends "Authorization: Bearer <CRON_SECRET>"; manual curl often uses raw secret
  const isValidAuth =
    authHeader &&
    ((cronSecret &&
      (authHeader === cronSecret || authHeader === `Bearer ${cronSecret}`)) ||
      (ingestionSecret && authHeader === `Bearer ${ingestionSecret}`));

  if (!isValidAuth) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authorization"
    });
  }

  // Vercel cron sends GET; manual triggers can use POST (or GET). Reject other methods.
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET (cron) or POST (manual) are allowed"
    });
  }

  // Log start
  const triggeredBy = detectTrigger(authHeader);
  const logEntry = await logStart("ingest", triggeredBy);

  try {
    // Parse options from request body (cron sends no body → defaults: legislature "17")
    const { date, fromDate, toDate, dryRun, legislature } = req.body || {};

    const result = await ingest({
      date,
      fromDate,
      toDate,
      dryRun: dryRun || false,
      legislature: legislature ?? "17"
    });

    // Log success
    if (logEntry) {
      await logSuccess(logEntry.id, result as unknown as Record<string, unknown>);
    }

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Ingestion error:", error);

    // Log error
    if (logEntry) {
      await logError(logEntry.id, message);
    }

    return res.status(500).json({
      error: "IngestionError",
      message
    });
  }
}
