/**
 * Local development server for API
 * Uses the same single catch-all route as Vercel (api/route.ts).
 */

import { config } from "dotenv";
import express, { Request, Response } from "express";
import { VercelRequest, VercelResponse } from "@vercel/node";

config({ path: ".env.local" });

const app = express();
const PORT = 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

async function setupRoutes() {
  const routeHandler = (await import("./api/route")).default;

  app.use("/api", (req: Request, res: Response) => {
    const vercelReq = req as unknown as VercelRequest;
    const vercelRes = res as unknown as VercelResponse;
    if (!vercelReq.url || vercelReq.url.startsWith("/api")) {
      (vercelReq as { url?: string }).url = req.originalUrl || req.url || "";
    }
    routeHandler(vercelReq, vercelRes).catch((err: unknown) => {
      console.error("Route error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 API Server running on http://0.0.0.0:${PORT}`);
    console.log(`   Accessible from host at http://localhost:${PORT}`);
    console.log(`\nAll /api/* routes are handled by a single catch-all (see api/route.ts).`);
    console.log(`  GET /api/agenda, /api/agenda/range, /api/sittings/:id, /api/scrutins, ...`);
    console.log(`  GET /api/ingestion-status`);
    console.log(`  POST/DELETE /api/push/register, GET/POST /api/cron/notify-scrutins`);
    console.log(`  GET /health\n`);
  });
}

setupRoutes().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
