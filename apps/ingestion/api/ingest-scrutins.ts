/**
 * POST /api/ingest-scrutins
 * Serverless function for scheduled scrutins (votes) ingestion
 * Protected by secret key
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestScrutins } from "../src/ingest-scrutins";
import {
  logStart,
  logSuccess,
  logError,
  detectTrigger
} from "../src/ingestion-logger";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET (cron) or POST (manual) are allowed"
    });
  }

  // Log start
  const triggeredBy = detectTrigger(authHeader);
  const logEntry = await logStart("ingest-scrutins", triggeredBy);

  try {
    const { fromDate, toDate, dryRun } = req.body || {};

    const result = await ingestScrutins({
      fromDate,
      toDate,
      dryRun: dryRun || false
    });

    // Log success
    if (logEntry) {
      await logSuccess(logEntry.id, result as unknown as Record<string, unknown>);
    }

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Scrutins ingestion error:", error);

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
