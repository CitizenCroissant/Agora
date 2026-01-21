# API

Serverless API layer for Agora, providing stable endpoints for web and mobile apps.

## Endpoints

### `GET /api/agenda?date=YYYY-MM-DD`
Returns agenda for a specific date with all sittings and their agenda items.

### `GET /api/agenda/range?from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns agendas for a date range, grouped by date.

### `GET /api/sittings/[id]`
Returns detailed information for a specific sitting, including provenance metadata.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000/api`

## Deployment

This API is designed to be deployed on Vercel:

```bash
vercel deploy
```

Make sure to set environment variables in your Vercel project settings.

## CORS

All endpoints support CORS to allow access from web and mobile apps.

## Caching

Responses are cached for 5 minutes using `s-maxage` and `stale-while-revalidate` directives.
