#!/bin/bash
# Test script for push notification cron endpoint

cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found"
  echo "Please create .env.local with CRON_SECRET=your-secret"
  exit 1
fi

# Load CRON_SECRET from .env.local
source .env.local

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not set in .env.local"
  exit 1
fi

echo "Testing cron endpoint with CRON_SECRET..."
echo ""

curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3001/api/cron/notify-scrutins | jq . || \
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3001/api/cron/notify-scrutins

echo ""
