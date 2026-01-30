/**
 * Local development server for API
 * This allows running the API locally without Vercel CLI
 * Keep in sync with dev-server.ts
 */

require("dotenv").config({ path: ".env.local" });
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

function adaptHandler(handler) {
  return (req, res) => {
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error("Handler error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  };
}

// Import the API handlers (use .ts for ts-node/register)
const agendaHandler = require("./api/agenda.ts");
const rangeHandler = require("./api/agenda/range.ts");
const sittingsHandler = require("./api/sittings/[id].ts");
const scrutinsIndexHandler = require("./api/scrutins/index.ts");
const scrutinsIdHandler = require("./api/scrutins/[id].ts");
const deputyHandler = require("./api/deputy/[acteurRef].ts");
const deputiesVotesHandler = require("./api/deputies/[acteurRef]/votes.ts");
const groupsIndexHandler = require("./api/groups/index.ts");
const groupsSlugHandler = require("./api/groups/[slug].ts");
const searchHandler = require("./api/search.ts");

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API routes
app.get("/api/agenda", adaptHandler(agendaHandler.default));
app.get("/api/agenda/range", adaptHandler(rangeHandler.default));
app.get("/api/sittings/:id", adaptHandler(sittingsHandler.default));
app.get("/api/scrutins", adaptHandler(scrutinsIndexHandler.default));
app.get("/api/scrutins/:id", adaptHandler(scrutinsIdHandler.default));
app.get("/api/deputy/:acteurRef", adaptHandler(deputyHandler.default));
app.get(
  "/api/deputies/:acteurRef/votes",
  adaptHandler(deputiesVotesHandler.default),
);
app.get("/api/groups", adaptHandler(groupsIndexHandler.default));
app.get("/api/groups/:slug", adaptHandler(groupsSlugHandler.default));
app.get("/api/search", adaptHandler(searchHandler.default));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET /api/agenda?date=YYYY-MM-DD`);
  console.log(`  GET /api/agenda/range?from=YYYY-MM-DD&to=YYYY-MM-DD`);
  console.log(`  GET /api/sittings/:id`);
  console.log(`  GET /api/scrutins?from=YYYY-MM-DD&to=YYYY-MM-DD`);
  console.log(`  GET /api/scrutins/:id`);
  console.log(`  GET /api/deputy/:acteurRef`);
  console.log(`  GET /api/deputies/:acteurRef/votes`);
  console.log(`  GET /api/groups`);
  console.log(`  GET /api/groups/:slug`);
  console.log(`  GET /api/search?q=...&type=scrutins|deputies|groups|all`);
  console.log(`  GET /health\n`);
});
