# Verifying ingestion cron jobs and Supabase data

This doc explains how to check that Vercel cron jobs for ingestion have run and that data in Supabase is up to date.

## 1. Cron configuration (ingestion app)

The ingestion app (`apps/ingestion`) defines these crons in `vercel.json`:

| Path | Schedule (UTC) | Description |
|------|----------------|-------------|
| `/api/ingest` | `0 2 * * *` (daily 02:00) | Agenda: sittings + agenda items (today + next 7 days) |
| `/api/ingest-scrutins` | `15 2 * * *` (daily 02:15) | Scrutins (votes) – last 30 days |
| `/api/ingest-deputies` | `0 3 1 * *` (1st of month 03:00) | Deputies (acteurs) |

## 2. Check that crons have run in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and select the **ingestion** project (the one that contains `apps/ingestion`).
2. Go to **Settings → Cron Jobs** (or **Deployments** and look for cron invocations).
3. Confirm the three cron jobs are listed and **Enabled**.
4. Check **Logs** or **Deployments → Functions**: for the ingestion deployment, open **Logs** and filter by the cron paths (`/api/ingest`, `/api/ingest-scrutins`, `/api/ingest-deputies`) to see recent runs and any errors.

Alternatively, in the project’s **Deployments** tab, open a deployment and check **Functions** / **Logs** for invocations at 02:00 / 02:15 / (monthly) 03:00 UTC.

**Required env for crons:**  
The ingestion project must have `CRON_SECRET` set in Vercel (Environment Variables). Vercel sends this in the `Authorization` header when invoking cron endpoints. Without it, the handlers return 401.

## 3. Check that data is up to date in Supabase

### Option A: Use the ingestion status API (recommended)

The API app exposes a read-only endpoint that reports freshness:

```bash
# Production (replace with your API base URL)
curl -s "https://YOUR_API.vercel.app/api/ingestion-status" | jq

# Local (with API running)
curl -s "http://localhost:3001/api/ingestion-status" | jq
```

Response fields:

- `agenda.latest_sitting_date` – latest sitting date in the DB
- `agenda.last_synced_at` – last time source_metadata was updated (sync time)
- `agenda.is_fresh` – `true` if there is a recent sync and latest sitting date is at least today

### Option B: Verification script

From the repo root, with `API_URL` pointing at your deployed or local API:

```bash
export API_URL="https://YOUR_API.vercel.app/api"
./scripts/verify-ingestion.sh
```

The script calls `/api/ingestion-status` and exits with success only if data is considered fresh.

### Option C: Supabase directly

In Supabase (SQL Editor or client):

- **Latest sitting date:**  
  `SELECT max(date) FROM sittings;`
- **Last sync time:**  
  `SELECT max(last_synced_at) FROM source_metadata;`

After a successful daily cron run (02:00 UTC), you should see:

- `max(date)` at least today (or the next day in UTC).
- `max(last_synced_at)` within the last 24–36 hours.

## 4. Manual trigger (for testing)

To run ingestion manually against the **deployed** ingestion app (e.g. to backfill or test):

```bash
# Agenda (today + next 7 days)
curl -X POST "https://YOUR_INGESTION_APP.vercel.app/api/ingest" \
  -H "Authorization: Bearer YOUR_INGESTION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'

# Optional: specific date or range
curl -X POST "https://YOUR_INGESTION_APP.vercel.app/api/ingest" \
  -H "Authorization: Bearer YOUR_INGESTION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-09"}'
```

Use the same base URL and `INGESTION_SECRET` for `/api/ingest-scrutins` and `/api/ingest-deputies` as needed.

## Summary

| What to check | Where |
|---------------|--------|
| Crons configured and enabled | Vercel → ingestion project → Settings → Cron Jobs |
| Cron runs and errors | Vercel → ingestion project → Logs / Deployments → Functions |
| `CRON_SECRET` set | Vercel → ingestion project → Settings → Environment Variables |
| Data freshness | `GET /api/ingestion-status` or `scripts/verify-ingestion.sh` |
| Raw DB state | Supabase → SQL: `max(date)` on `sittings`, `max(last_synced_at)` on `source_metadata` |
