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

For official documentation links, file formats, and how the publisher links amendments to bills (and why scrutins have no official bill/amendment IDs), see **[docs/OPEN_DATA_SOURCES.md](../../docs/OPEN_DATA_SOURCES.md)**.

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

Scrutins are linked to sittings by `seanceRef` (matching `sittings.official_id`) or by date when no match is found. When the scrutin text mentions "amendement n° X" and we have that amendment for the linked bill, **scrutin → amendment** links are stored in `scrutin_amendments` (requires amendments to be ingested first).

### Dossiers législatifs (bills + bill textes)

Dossier ingestion creates dossiers, actes, initiateurs, and **bill_texts** (one per “version de texte” from the actes: dossier uid + `texte_associe` / `texte_adopte` from the actes tree).

- **Source**: `Dossiers_Legislatifs.json.zip`
- **Tables**: `dossiers_legislatifs`, `actes_legislatifs`, `dossiers_initiateurs`, `bill_texts` (bill_id, texte_ref)
- **CLI**: `npm run ingest:dossiers` (optionally `--legislature 17` or `--legislature all`, `--dry-run`)

**Order**: Run `ingest:dossiers` first so that bills and bill_texts exist before amendments and scrutins.

### Amendments (lightweight list per texte)

Amendment list is ingested from the Amendements JSON ZIP. **Bill textes are created by dossier ingestion**; this job only inserts amendment rows into existing `bill_texts`. Scrutins ingestion then links scrutins to amendments by parsing amendment numbers from the vote title/objet.

- **Source**: `https://data.assemblee-nationale.fr/static/openData/repository/{leg}/loi/amendements_div_legis/Amendements.json.zip`
- **Run after**: `ingest:dossiers` (so bills and bill_texts exist)
- **Tables**: `amendments` (bill_text_id, official_id, numero, official_url), `scrutin_amendments` (scrutin_id, amendment_id)

**CLI**:

```bash
# Ingest amendment list (default legislature 17); uses existing bill_texts from dossier ingestion
npm run ingest:amendments

npm run ingest:amendments -- --legislature 17 --dry-run
```

**Order for full linking**: Run `ingest:dossiers`, then `ingest:amendments`, then `ingest:scrutins` so that scrutins can be linked to both bills and amendments.

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
