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

### Serverless Endpoints

The ingestion can also be triggered via HTTP:

**Agenda (sittings + agenda items):**

```bash
POST /api/ingest
Authorization: Bearer YOUR_INGESTION_SECRET

{
  "date": "2026-01-25",      // optional
  "fromDate": "2026-01-20",  // optional
  "toDate": "2026-01-27",    // optional
  "dryRun": false            // optional
}
```

**Scrutins (votes):**

```bash
POST /api/ingest-scrutins
Authorization: Bearer YOUR_INGESTION_SECRET

{
  "fromDate": "2026-01-01",  // optional; without range: last 30 days
  "toDate": "2026-01-31",    // optional
  "dryRun": false            // optional
}
```

### Scheduled Execution

When deployed to Vercel (configured in `vercel.json`):

- **Agenda**: `/api/ingest` runs daily at 2:00 AM.
- **Scrutins**: `/api/ingest-scrutins` runs daily at 2:15 AM (last 30 days by default).

## Data Source

**Now integrated with real Assemblée nationale data!**

The ingestion system fetches live parliamentary data from:

- **Source**: `http://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip`
- **Legislature**: 17th (2024-2029)
- **Format**: ZIP archive containing JSON files for each meeting
- **Update frequency**: Updated regularly by the Assemblée nationale
- **Coverage**: All public sessions (séances publiques) and commission meetings

### Data Structure

Each meeting includes:

- Unique identifier (UID)
- Date and time (start/end)
- Location (e.g., "Assemblée nationale", "Sénat")
- Meeting type (séance publique, commission, etc.)
- Agenda items (ordre du jour) with:
  - Title and description
  - Legislative dossier references
  - Type (Questions au Gouvernement, Discussion, etc.)
  - Status (Confirmé, Supprimé)

### Caching

- Downloaded data is cached in memory for 1 hour
- Subsequent requests within the cache period use cached data
- Reduces load on the official API

See `src/assemblee-client.ts` for implementation details.

### Scrutins (votes)

Scrutins (roll-call votes) are ingested from a separate open data source:

- **Source**: `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip`
- **Format**: ZIP archive containing one JSON file per scrutin
- **Schema**: See `docs/SCRUTINS_SCHEMA.md`

**CLI**:

```bash
# Ingest all scrutins (and per-deputy votes)
npm run ingest:scrutins

# Ingest scrutins for a date range
npm run ingest:scrutins -- --from 2026-01-01 --to 2026-01-31

# Dry run
npm run ingest:scrutins -- --dry-run
```

Scrutins are linked to sittings by `seanceRef` (matching `sittings.official_id`) or by date when no match is found.

### Deputies (députés)

Deputy profiles (names, circonscription, political group, etc.) are ingested from the AMO acteurs dataset:

- **Source**: `https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip`
- **Format**: ZIP archive containing composite JSON (acteurs + organes)

**CLI**:

```bash
# Ingest all active deputies
npm run ingest:deputies

# Dry run
npm run ingest:deputies -- --dry-run
```

Deputy names are used to enrich scrutin vote lists (instead of showing only `acteur_ref`).
