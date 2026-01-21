# Ingestion

Data ingestion functions for Agora, fetching official Assemblée nationale data.

## Features

- Fetches seances (parliamentary sessions) from official sources
- Transforms data to our domain model
- Upserts into Supabase with change detection
- Supports single date or date range ingestion
- Includes serverless endpoint for scheduled execution

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `env.example` to `.env.local` and configure:
   ```bash
   cp env.example .env.local
   ```

3. Set environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key
   - `INGESTION_SECRET` - Secret key to protect the API endpoint

## Usage

### CLI

Run ingestion from command line:

```bash
# Ingest today + next 7 days (default)
npm run ingest

# Ingest a specific date
npm run ingest -- --date 2026-01-25

# Ingest a date range
npm run ingest -- --from 2026-01-20 --to 2026-01-27

# Dry run (no database writes)
npm run ingest -- --dry-run
```

### Serverless Endpoint

The ingestion can also be triggered via HTTP:

```bash
POST /api/ingest
Authorization: Bearer YOUR_INGESTION_SECRET

{
  "date": "2026-01-25"  // optional
}
```

### Scheduled Execution

When deployed to Vercel, the function runs automatically at 2 AM daily (configured in `vercel.json`).

## Data Source

Currently uses mock data for demonstration. In production, integrate with:
- Assemblée nationale open data API
- Official data.assemblee-nationale.fr portal
- Parliament data feeds

See `src/assemblee-client.ts` for implementation details.
