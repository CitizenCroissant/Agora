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

# Ingest bills for a specific legislature or all (default: 17; cron uses 17)
npm run ingest -- --legislature 17
npm run ingest -- --legislature all
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
  "dryRun": false,           // optional
  "legislature": "17"        // optional: "17", "16", "15", "14", or "all"; default "17" (cron uses this)
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
- **Coverage**: All public sessions (séances publiques) and commission (and other organe) meetings. The main `npm run ingest` ingests both; run `ingest:organes` first so `sittings.organe_ref` can reference the organes table.

#### Commission meetings and agenda

- The same Agenda.zip contains **reunionCommission_type** entries (commission meetings) with full agenda (ODJ). Each has `organeReuniRef` pointing to the commission/organe (e.g. PO420120 = Commission des Affaires sociales).
- Commission reunions in the archive often **do not have** `identifiants.DateSeance`; the date is taken from **timeStampDebut** (see `assemblee-client.ts` `getReunionDate()`).
- For commission detail pages to show meetings, **run `ingest:organes` before (or regularly with) agenda ingestion**. Some organes referenced by the agenda may be created during the legislature and only appear in a newer AMO export; re-run `npm run ingest:organes` when the Assemblée updates the AMO dataset to reduce “foreign key” errors for sittings.
- Optional: `npx ts-node src/inspect-commission-organes.ts [from] [to]` prints reunion types and organe ref counts from the archive (no DB writes).

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

**Organes (commissions, délégations):**

Run once (or when the AMO dataset is updated) so commission reunions and deputy profiles can resolve organe names:

```bash
npm run ingest:organes
npm run ingest:organes -- --dry-run
```

**Deputy–commission membership:**

Run after `ingest:organes` and `ingest:deputies` to fill `deputy_organes` (used on deputy profile pages):

```bash
npm run ingest:deputy-organes
npm run ingest:deputy-organes -- --dry-run
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

### Circonscriptions

Deputies have a foreign key `ref_circonscription` → `circonscriptions(id)`, so circonscriptions must exist before deputies. **Circonscriptions** are ingested from the **official source** (data.gouv.fr – Contours géographiques des circonscriptions législatives, GeoJSON). **Deputies ingestion** no longer creates circonscriptions; run `ingest:circonscriptions` first.

**CLI**:

```bash
# 1. Ingest circonscriptions from official source (data.gouv.fr GeoJSON)
npm run ingest:circonscriptions
npm run ingest:circonscriptions -- --dry-run

# 2. Then ingest deputies (requires circonscriptions to exist)
npm run ingest:deputies
```
