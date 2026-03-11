# Deploying Web, API, and Ingestion to Vercel

This monorepo has three Vercel projects: **web** (Next.js), **api** (serverless), and **ingestion** (serverless + crons). Deploy from the **repository root**. Web and Ingestion use Root Directory `.`; the **API project must use Root Directory `apps/api`** so Vercel applies `apps/api/vercel.json` (rewrites and functions)—otherwise /api/* returns 404.

**Production domain:** **https://agora-citoyens.fr** (web). Add it in Vercel and set the env vars below.

## One-time dashboard setup

For each project, in [Vercel Dashboard](https://vercel.com) → Project → Settings → General:

### Web project

- **Root Directory:** `.` (repository root). Leave empty or set to `.`.
- **Build Command:** `npm run build -- --filter=@agora/web`
- **Install Command:** `npm ci`
- **Output Directory:** `apps/web/.next`
- **Domains:** Add **agora-citoyens.fr** and **www.agora-citoyens.fr** in Settings → Domains (assign to this project; redirect www → apex or vice versa as preferred).
- **Environment variables** (Settings → Environment Variables), for **Production** (and optionally Preview): see [Vercel environment variables](#vercel-environment-variables) below.
- **Headers / CSP:** Do not set a Content-Security-Policy header in the project that restricts `script-src-elem` to `'none'`. The app sets a suitable CSP in `next.config.js`. If you see “Failsafe &lt;meta&gt; CSP inserted” and `script-src-elem 'none'` in the console, that comes from a **browser extension** (e.g. Document CSP / DocumentCSP.js), not from the server: disable the extension for this site or whitelist **agora-citoyens.fr** in the extension.

### API project

- **Root Directory:** `apps/api` (required so Vercel uses `apps/api/vercel.json` for rewrites and the catch-all function; with root `.` the API returns 404).
- **Domains:** Add **api.agora-citoyens.fr** in Settings → Domains.
- **Environment variables:** see [Vercel environment variables](#vercel-environment-variables) below (optional **DIGEST_BASE_URL** for digest emails).
- **Install Command:** `cd ../.. && npm ci` (run from repo root so the full monorepo is installed).
- **Build Command:** `cd ../.. && npm run build -- --filter=@agora/api`
- **Output Directory:** leave default (serverless functions from `apps/api/vercel.json`).

### Ingestion project

- **Root Directory:** `.` (repository root).
- **Build Command:** `npm run build -- --filter=@agora/ingestion`
- **Install Command:** `npm ci`
- **Output Directory:** `apps/ingestion/public` (or leave default; ingestion uses serverless functions in `api/` and optional static output).

Ingestion exposes serverless routes (`/api/ingest`, `/api/ingest-scrutins`, `/api/ingest-deputies`) and crons (see `apps/ingestion/vercel.json`). With Root Directory `.`, function paths in the dashboard should be under `apps/ingestion/api/`.

## Deploy from CLI

From the repo root:

```bash
# 1. Build everything locally (optional but recommended)
npm run build

# 2. Deploy API (root .vercel is linked to API project)
npx vercel --yes

# 3. Deploy Web (override project)
VERCEL_ORG_ID=team_LM8xfWwBbczRXxgbkiu72mS9 VERCEL_PROJECT_ID=prj_eZzUiXEgefSSbwEpEuwkvV5rCUhd npx vercel --yes

# 4. Deploy Ingestion (override project)
VERCEL_ORG_ID=team_LM8xfWwBbczRXxgbkiu72mS9 VERCEL_PROJECT_ID=prj_bJjDkgIAlD3GAWOpsuALj2LTcWbL npx vercel --yes
```

For production, add `--prod` to each `vercel` command.

Or use the script (builds once, then deploys all three):

```bash
./scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh --prod
```

## Production URLs and env

- **Web (production):** https://agora-citoyens.fr, https://www.agora-citoyens.fr
- **API (production):** https://api.agora-citoyens.fr

### Vercel environment variables

Set these in the Vercel Dashboard (Project → Settings → Environment Variables) for the relevant environments (Production, and optionally Preview / Development).

Alternatively, from the repo root (after `vercel login` and with the repo linked to the API project for the API step):

```bash
./scripts/set-vercel-env.sh
```

This sets **Web**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` (production + preview). **API**: `DIGEST_BASE_URL` (production). To target a specific API project instead of the linked one, set `VERCEL_API_PROJECT_ID` before running.

**Web project**

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_APP_URL` | `https://agora-citoyens.fr` | Production, Preview |
| `NEXT_PUBLIC_API_URL` | `https://api.agora-citoyens.fr/api` | Production, Preview, Development |

**API project**

| Name | Value | Environments |
|------|--------|--------------|
| `DIGEST_BASE_URL` | `https://agora-citoyens.fr` | Production (optional; for digest email links) |

Other API env vars (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CRON_SECRET`) are unchanged.

## Ingestion scripts (CLI, run locally or in CI)

Ingestion has CLI entrypoints for one-off or local runs (they use `ts-node` and need the workspace). Run from **apps/ingestion** or use the workspace from root:

```bash
# From repo root (use -w to run in apps/ingestion)
npm run ingest -w apps/ingestion -- --date 2026-01-22
npm run ingest -w apps/ingestion -- --from 2026-01-20 --to 2026-01-27
npm run ingest -w apps/ingestion -- --dry-run

# From apps/ingestion
cd apps/ingestion
npm run ingest -- --date 2026-01-22
npm run ingest:scrutins -- --from 2026-01-20 --to 2026-01-27
npm run ingest:deputies
npm run ingest:circonscriptions
npm run tag:all-scrutins
npm run tag:single-scrutin -- --id <scrutin-id>
```

These scripts are not deployed; they run locally or in CI. On Vercel, ingestion runs via the deployed serverless routes and crons.

## Why root directory must be repo root

With Root Directory set to a subfolder (`apps/web`, `apps/api`, `apps/ingestion`), Vercel only uses that subfolder in the build. The rest of the monorepo (e.g. `packages/shared`, root `package-lock.json`) is not available, so `npm ci` and `turbo run build -- --filter=...` fail. Using the repo root ensures the full workspace is present and Turbo can build dependencies and the app.
