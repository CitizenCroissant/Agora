/**
 * Local development server for API
 * This allows running the API locally without Vercel CLI
 */

import { config } from "dotenv";
import express, { Request, Response } from "express";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Load environment variables
config({ path: ".env.local" });

const app = express();
// Use static port 3001 for API server
const PORT = 3001;

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper to adapt Express req/res to Vercel req/res
function adaptHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>
) {
  return async (req: Request, res: Response) => {
    try {
      await handler(
        req as unknown as VercelRequest,
        res as unknown as VercelResponse
      );
    } catch (error) {
      console.error("Handler error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}

// Import and setup routes dynamically
async function setupRoutes() {
  const agendaHandler = await import("./api/agenda");
  const rangeHandler = await import("./api/agenda/range");
  const sittingsHandler = await import("./api/sittings/[id]");
  const scrutinsIndexHandler = await import("./api/scrutins/index");
  const scrutinsIdHandler = await import("./api/scrutins/[id]");
  const deputyHandler = await import("./api/deputy/[acteurRef]");
  const deputiesIndexHandler = await import("./api/deputies/index");
  const deputiesVotesHandler = await import("./api/deputies/[acteurRef]/votes");
  const departementsIndexHandler = await import("./api/departements/index");
  const groupsIndexHandler = await import("./api/groups/index");
  const groupsSlugHandler = await import("./api/groups/[slug]");
  const circonscriptionsIndexHandler = await import(
    "./api/circonscriptions/index"
  );
  const circonscriptionsGeojsonHandler = await import(
    "./api/circonscriptions/geojson"
  );
  const circonscriptionsIdHandler = await import("./api/circonscriptions/[id]");
  const searchHandler = await import("./api/search");
  const pushRegisterHandler = await import("./api/push/register");
  const notifyScrutinsHandler = await import("./api/cron/notify-scrutins");

  app.get("/api/agenda", adaptHandler(agendaHandler.default));
  app.get("/api/agenda/range", adaptHandler(rangeHandler.default));
  app.get("/api/sittings/:id", adaptHandler(sittingsHandler.default));
  app.get("/api/scrutins", adaptHandler(scrutinsIndexHandler.default));
  app.get("/api/scrutins/:id", adaptHandler(scrutinsIdHandler.default));
  app.get("/api/deputy/:acteurRef", adaptHandler(deputyHandler.default));
  app.get("/api/departements", adaptHandler(departementsIndexHandler.default));
  app.get("/api/deputies", adaptHandler(deputiesIndexHandler.default));
  app.get(
    "/api/deputies/:acteurRef/votes",
    adaptHandler(deputiesVotesHandler.default)
  );
  app.get("/api/groups", adaptHandler(groupsIndexHandler.default));
  app.get("/api/groups/:slug", adaptHandler(groupsSlugHandler.default));
  app.get(
    "/api/circonscriptions",
    adaptHandler(circonscriptionsIndexHandler.default)
  );
  app.get(
    "/api/circonscriptions/geojson",
    adaptHandler(circonscriptionsGeojsonHandler.default)
  );
  app.get(
    "/api/circonscriptions/:id",
    adaptHandler(circonscriptionsIdHandler.default)
  );
  app.get("/api/search", adaptHandler(searchHandler.default));
  app.post("/api/push/register", adaptHandler(pushRegisterHandler.default));
  app.delete("/api/push/register", adaptHandler(pushRegisterHandler.default));
  app.get(
    "/api/cron/notify-scrutins",
    adaptHandler(notifyScrutinsHandler.default)
  );
  app.post(
    "/api/cron/notify-scrutins",
    adaptHandler(notifyScrutinsHandler.default)
  );

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Start server - bind to all interfaces (0.0.0.0) to allow external access
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 API Server running on http://0.0.0.0:${PORT}`);
    // Note: Access from device requires host IP (check VS Code Ports panel or use tunnel mode)
    console.log(`   Accessible from host at http://localhost:${PORT}`);
    console.log(
      `   For device access, use your machine's LAN IP (check VS Code Ports panel)`
    );
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/agenda?date=YYYY-MM-DD`);
    console.log(`  GET /api/agenda/range?from=YYYY-MM-DD&to=YYYY-MM-DD`);
    console.log(`  GET /api/sittings/:id`);
    console.log(`  GET /api/scrutins?from=YYYY-MM-DD&to=YYYY-MM-DD`);
    console.log(`  GET /api/scrutins/:id`);
    console.log(`  GET /api/deputy/:acteurRef`);
    console.log(`  GET /api/departements`);
    console.log(`  GET /api/deputies?departement=...`);
    console.log(`  GET /api/deputies/:acteurRef/votes`);
    console.log(`  GET /api/groups`);
    console.log(`  GET /api/groups/:slug`);
    console.log(`  GET /api/circonscriptions`);
    console.log(`  GET /api/circonscriptions/geojson`);
    console.log(`  GET /api/circonscriptions/:id`);
    console.log(`  GET /api/search?q=...&type=scrutins|deputies|groups|all`);
    console.log(
      `  POST /api/push/register (body: expo_push_token, topic?, deputy_acteur_ref?)`
    );
    console.log(`  DELETE /api/push/register (body: expo_push_token)`);
    console.log(
      `  GET/POST /api/cron/notify-scrutins (Authorization: Bearer CRON_SECRET)`
    );
    console.log(`  GET /health\n`);
  });
}

setupRoutes().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
