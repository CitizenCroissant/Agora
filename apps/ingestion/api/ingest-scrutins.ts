/**
 * POST /api/ingest-scrutins
 * Serverless function for scheduled scrutins (votes) ingestion
 * Protected by secret key
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestScrutins } from "../src/ingest-scrutins";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only POST requests are allowed",
    });
  }

  const authHeader = req.headers.authorization;
  const secret = process.env.INGESTION_SECRET;

  if (!secret) {
    console.error("INGESTION_SECRET not configured");
    return res.status(500).json({
      error: "ConfigurationError",
      message: "Ingestion endpoint not properly configured",
    });
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authorization",
    });
  }

  try {
    const { fromDate, toDate, dryRun } = req.body || {};

    const result = await ingestScrutins({
      fromDate,
      toDate,
      dryRun: dryRun || false,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Scrutins ingestion error:", error);
    return res.status(500).json({
      error: "IngestionError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
