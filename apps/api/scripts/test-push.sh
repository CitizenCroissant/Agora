#!/bin/bash
# Quick script to test push notifications
# Usage: cd apps/api && ./scripts/test-push.sh

cd "$(dirname "$0")/.."

echo "🚀 Testing Push Notifications..."
echo ""

npx tsx scripts/test-push-notification.ts
