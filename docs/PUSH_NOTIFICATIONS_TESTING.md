# Testing push notifications (Expo)

Push notifications require a **physical device** (iOS or Android). Simulators/emulators do not receive real push notifications.

## 1. Prerequisites

- API running and reachable from your phone (same Wi‑Fi or use a tunnel like ngrok).
- Mobile app built with EAS development build (see [DEVELOPMENT_BUILD.md](../apps/mobile/DEVELOPMENT_BUILD.md)). Push is not supported in Expo Go (SDK 53+).

## 2. Get a real Expo push token from the app

1. Open the **mobile app** on your device (development build).
2. Go to the **About** tab.
3. Turn **Notifications push** ON.
4. Accept the system permission prompt when asked.
5. The app will register the token with your API (POST `/api/push/register`).

If the API is not reachable (e.g. `localhost` from the device), fix `API_URL`:

- In **app.json** → `extra.apiUrl`: set to your machine’s LAN IP, e.g. `http://192.168.1.x:3001/api`, or use an ngrok URL.
- Or run the app with a custom config so `Config.API_URL` points to your API.

## 3. (Optional) Copy the token for manual testing

To send a test push from Expo’s website or from your own script, you need the token. You can log it in the app:

- In `apps/mobile/lib/notifications.ts`, after `getExpoPushTokenAsync()` returns, the app sends the token to the backend only. To see it in the UI or logs, add a temporary `console.log(token)` or show it in the About screen (e.g. in a “Debug” section). Then use that value in step 5.

Alternatively, after enabling notifications in the app, the token is stored in Supabase in the `push_tokens` table. You can read it from there (e.g. Supabase dashboard or a small script) and use it in step 5.

## 4. Trigger your cron (sends to all registered tokens)

Your cron sends to every token with `topic = 'all'` when there are scrutins in the last 24h. To trigger it manually against your **local** API:

```bash
cd apps/api
# Load CRON_SECRET from .env.local and call the cron endpoint
node -e "
require('dotenv').config({ path: '.env.local' });
const secret = process.env.CRON_SECRET;
const { execSync } = require('child_process');
const out = execSync(
  'curl -s -H \"Authorization: Bearer ' + secret.replace(/'/g, \"'\\\\'\") + '\" http://localhost:3001/api/cron/notify-scrutins',
  { encoding: 'utf8' }
);
console.log(out);
"
```

If there are scrutins in the last 24h and your device’s token is registered, you should receive a push. If the response says `"No tokens to notify"`, the app did not register (check API_URL and that you turned notifications ON). If it says `"sent": 1` (or more), the push was sent to Expo’s servers; it should arrive on the device shortly.

## 5. Send a test push to one token (Expo tool)

Useful when you don’t want to depend on scrutins or the cron.

1. Get your Expo push token (from app log, Supabase `push_tokens.expo_push_token`, or a temporary debug screen).
2. Open **Expo Push Notifications Tool**: https://expo.dev/notifications (or https://expo.dev → your project → Notifications).
3. Paste the token (e.g. `ExponentPushToken[xxxxx]`).
4. Set **Title** and **Message**, then send.

You should see the notification on the device. Tapping it should open the app (your handler in `_layout.tsx` navigates to `/votes` or `/votes/[id]`).

## 6. End-to-end checklist

| Step | Action |
|------|--------|
| 1 | API running; device and API on same network (or tunnel). |
| 2 | In app: About → Notifications ON; grant permission. |
| 3 | Confirm token in Supabase `push_tokens` or in app logs. |
| 4 | Run cron script above (or wait for Vercel cron) **and** have at least one scrutin with `created_at` in last 24h. |
| 5 | Or use Expo Push Tool with your token for an immediate test. |
| 6 | Tap the notification → app opens on `/votes` or scrutin detail. |

## Troubleshooting

- **No notification:** Check that the token is valid (ExponentPushToken[...]), that you’re on a real device, and that the app has notification permission. Check Expo’s delivery status if you use their dashboard.
- **“No tokens to notify”:** Token not registered. Check API_URL in the app, network, and that POST `/api/push/register` succeeds (e.g. in network tab or API logs).
- **401 on cron:** Ensure `CRON_SECRET` is set in the environment used by the API (e.g. `.env.local` for local dev, Vercel env for production).
