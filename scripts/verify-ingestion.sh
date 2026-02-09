#!/usr/bin/env bash
# Verify ingestion cron and Supabase data freshness.
# Usage: API_URL=https://your-api.vercel.app/api ./scripts/verify-ingestion.sh
#        Or run from apps/api with dev server: API_URL=http://localhost:3001/api ./scripts/verify-ingestion.sh

set -e

API_URL="${API_URL:-http://localhost:3001/api}"
ENDPOINT="${API_URL%/}/ingestion-status"

echo "Ingestion verification"
echo "======================"
echo "API: $ENDPOINT"
echo ""

RESPONSE=$(curl -sS -w "\n%{http_code}" "$ENDPOINT")
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: API returned HTTP $HTTP_CODE"
  echo "$HTTP_BODY" | head -20
  exit 1
fi

echo "$HTTP_BODY" | jq -r '
  "Data status:",
  "  Latest sitting date: \(.agenda.latest_sitting_date // "none")",
  "  Last synced at:     \(.agenda.last_synced_at // "never")",
  "  Is fresh:           \(.agenda.is_fresh)",
  "  Checked at:         \(.checked_at)",
  ""
'

if echo "$HTTP_BODY" | jq -e '.agenda.is_fresh == true' >/dev/null 2>&1; then
  echo "Result: Data looks up to date."
else
  echo "Result: Data may be stale. Ensure:"
  echo "  1. Vercel cron jobs have run (see docs/INGESTION_CRON_VERIFICATION.md)"
  echo "  2. CRON_SECRET is set in the ingestion project on Vercel"
  echo "  3. Ingestion project is deployed and crons are enabled"
  exit 1
fi
