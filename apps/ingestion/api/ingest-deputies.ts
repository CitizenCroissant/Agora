/**
 * POST /api/ingest-deputies
 * Serverless function for scheduled deputies (acteurs) ingestion
 * Protected by secret key. Run monthly via Vercel Cron.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestDeputies } from "../src/ingest-deputies";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only POST requests are allowed",
    });
  }

  // Check authorization
  // Vercel cron jobs send CRON_SECRET directly in Authorization header (not Bearer format)
  // Manual calls can use Bearer INGESTION_SECRET format
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
  // Vercel cron: Authorization: <CRON_SECRET>
  // Manual: Authorization: Bearer <INGESTION_SECRET>
  const isValidAuth =
    authHeader &&
    ((cronSecret && authHeader === cronSecret) ||
      (ingestionSecret && authHeader === `Bearer ${ingestionSecret}`));

  if (!isValidAuth) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authorization",
    });
  }

  try {
    const { dryRun } = req.body || {};

    const result = await ingestDeputies({
      dryRun: dryRun || false,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Deputies ingestion error:", error);
    return res.status(500).json({
      error: "IngestionError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
