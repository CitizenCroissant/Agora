/**
 * Local development server for API
 * This allows running the API locally without Vercel CLI
 */

require('dotenv').config({ path: '.env.local' });
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Import the API handlers
const agendaHandler = require('./api/agenda.ts');
const rangeHandler = require('./api/agenda/range.ts');
const sittingsHandler = require('./api/sittings/[id].ts');

// Middleware for parsing JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API routes
app.get('/api/agenda', (req, res) => {
  agendaHandler.default(req, res);
});

app.get('/api/agenda/range', (req, res) => {
  rangeHandler.default(req, res);
});

app.get('/api/sittings/:id', (req, res) => {
  sittingsHandler.default(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET /api/agenda?date=YYYY-MM-DD`);
  console.log(`  GET /api/agenda/range?from=YYYY-MM-DD&to=YYYY-MM-DD`);
  console.log(`  GET /api/sittings/:id`);
  console.log(`  GET /health\n`);
});
