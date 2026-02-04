/**
 * POST /api/ingest
 * Serverless function for scheduled ingestion
 * Protected by secret key
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { ingest } from "../src/ingest";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only POST requests are allowed",
    });
  }

  // Check authorization
  // Accept either CRON_SECRET (from Vercel cron jobs) or INGESTION_SECRET (for manual calls)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const ingestionSecret = process.env.INGESTION_SECRET;

  if (!cronSecret && !ingestionSecret) {
    console.error("CRON_SECRET or INGESTION_SECRET must be configured");
    return res.status(500).json({
      error: "ConfigurationError",
      message: "Ingestion endpoint not properly configured",
    });
  }

  // Verify the Authorization header matches either secret
  const isValidAuth =
    authHeader &&
    ((cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (ingestionSecret && authHeader === `Bearer ${ingestionSecret}`));

  if (!isValidAuth) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authorization",
    });
  }

  try {
    // Parse options from request body
    const { date, fromDate, toDate, dryRun } = req.body || {};

    const result = await ingest({
      date,
      fromDate,
      toDate,
      dryRun: dryRun || false,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Ingestion error:", error);
    return res.status(500).json({
      error: "IngestionError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
