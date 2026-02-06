# API Scripts

Utility scripts for testing and development.

## test-push-notification.ts

Test script to verify push notification functionality:

1. Checks registered push tokens in the database
2. Sends a test notification to all registered devices

**Usage:**

```bash
cd apps/api
npx tsx scripts/test-push-notification.ts
```

**Requirements:**

- `.env.local` file with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Push tokens registered in the database (via mobile app)

## test-push.sh

Convenience shell script wrapper for `test-push-notification.ts`.

**Usage:**

```bash
cd apps/api
./scripts/test-push.sh
```
