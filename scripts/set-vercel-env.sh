#!/usr/bin/env bash
# Set production (and preview) env vars for Web and API via Vercel CLI.
# Run from repo root. Requires: vercel login and, for API, repo linked to API project (or set VERCEL_API_PROJECT_ID).
set -e
cd "$(dirname "$0")/.."

ORG_ID="${VERCEL_ORG_ID:-team_LM8xfWwBbczRXxgbkiu72mS9}"
WEB_PROJECT_ID="prj_eZzUiXEgefSSbwEpEuwkvV5rCUhd"

#!/usr/bin/env bash
# Set production (and preview) env vars for Web and API via Vercel CLI.
# Run from repo root. Requires: vercel login and, for API, repo linked to API project (or set VERCEL_API_PROJECT_ID).
set -e
cd "$(dirname "$0")/.."

ORG_ID="${VERCEL_ORG_ID:-team_LM8xfWwBbczRXxgbkiu72mS9}"
WEB_PROJECT_ID="prj_eZzUiXEgefSSbwEpEuwkvV5rCUhd"

echo "Setting Web project env vars (project $WEB_PROJECT_ID)..."
export VERCEL_ORG_ID="$ORG_ID"
export VERCEL_PROJECT_ID="$WEB_PROJECT_ID"

echo "https://agora-citoyens.fr" | npx vercel env add NEXT_PUBLIC_APP_URL production --yes --force
echo "https://agora-citoyens.fr" | npx vercel env add NEXT_PUBLIC_APP_URL preview --yes --force
echo "https://api.agora-citoyens.fr/api" | npx vercel env add NEXT_PUBLIC_API_URL production --yes --force
echo "https://api.agora-citoyens.fr/api" | npx vercel env add NEXT_PUBLIC_API_URL preview --yes --force

echo "Setting API project env var (DIGEST_BASE_URL)..."
if [ -n "${VERCEL_API_PROJECT_ID}" ]; then
  export VERCEL_PROJECT_ID="$VERCEL_API_PROJECT_ID"
  export VERCEL_ORG_ID="$ORG_ID"
else
  unset VERCEL_PROJECT_ID
  unset VERCEL_ORG_ID
fi
echo "https://agora-citoyens.fr" | npx vercel env add DIGEST_BASE_URL production --yes --force

echo "Done. Redeploy Web and API for changes to take effect."

echo "Done. Redeploy Web and API for changes to take effect."
