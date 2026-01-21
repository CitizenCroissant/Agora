/**
 * Local development server for API
 * This allows running the API locally without Vercel CLI
 */

import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables
config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

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

// Helper to adapt Express req/res to Vercel req/res
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptHandler(handler: (req: VercelRequest, res: VercelResponse) => Promise<any>) {
  return async (req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handler(req as any, res as any);
    } catch (error) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

// Import and setup routes dynamically
async function setupRoutes() {
  const agendaHandler = await import('./api/agenda');
  const rangeHandler = await import('./api/agenda/range');
  const sittingsHandler = await import('./api/sittings/[id]');

  app.get('/api/agenda', adaptHandler(agendaHandler.default));
  app.get('/api/agenda/range', adaptHandler(rangeHandler.default));
  app.get('/api/sittings/:id', adaptHandler(sittingsHandler.default));

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
}

setupRoutes().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
