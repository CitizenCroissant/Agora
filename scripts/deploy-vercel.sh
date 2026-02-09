#!/usr/bin/env bash
# Deploy web, API, and ingestion to Vercel from repo root.
# Requires: Root Directory = "." for all three projects (see docs/VERCEL_DEPLOY.md).
set -e
cd "$(dirname "$0")/.."

VERCEL_ORG_ID=team_LM8xfWwBbczRXxgbkiu72mS9

echo "Building monorepo..."
npm run build

echo "Deploying API..."
npx vercel --yes "${@}"

echo "Deploying Web..."
VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=prj_eZzUiXEgefSSbwEpEuwkvV5rCUhd npx vercel --yes "${@}"

echo "Deploying Ingestion..."
VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=prj_bJjDkgIAlD3GAWOpsuALj2LTcWbL npx vercel --yes "${@}"

echo "Done. Add --prod for production."
