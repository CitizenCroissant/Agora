# Setup Guide

Complete guide to set up and run Agora locally and in production.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier is sufficient for development)
- Vercel account (for deployment, optional)
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Agora
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `database/schema.sql` and execute it
4. Note your Project URL and Service Role Key (Settings > API)

### 3. Configure API

```bash
cd apps/api
cp env.example .env.local
```

Edit `.env.local`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 4. Configure Ingestion

```bash
cd apps/ingestion
cp env.example .env.local
```

Edit `.env.local`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
INGESTION_SECRET=choose-a-secret-key
```

### 5. Configure Web App

```bash
cd apps/web
cp env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 6. Build Shared Package

```bash
cd packages/shared
npm run build
```

### 7. Run Development Servers

Open three terminal windows:

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
```
API will run on `http://localhost:3000`

**Terminal 2 - Web:**
```bash
cd apps/web
npm run dev
```
Web will run on `http://localhost:3000` (or 3001 if 3000 is taken)

**Terminal 3 - Ingestion (one-time):**
```bash
cd apps/ingestion
npm run ingest -- --dry-run
```

## Populating with Mock Data

To populate the database with mock data for testing:

```bash
cd apps/ingestion
npm run ingest -- --date 2026-01-22
```

This will insert sample data for the specified date.

## Mobile App Setup

1. Install Expo CLI globally:
   ```bash
   npm install -g expo-cli
   ```

2. Update API URL in mobile app:
   - Edit `apps/mobile/app/(tabs)/index.tsx`
   - Edit `apps/mobile/app/(tabs)/timeline.tsx`
   - Edit `apps/mobile/app/sitting/[id].tsx`
   - Replace `const API_URL` with your deployed API URL

3. Start mobile app:
   ```bash
   cd apps/mobile
   npm start
   ```

4. Scan QR code with Expo Go app (iOS/Android)

## Production Deployment

### Deploy API to Vercel

```bash
cd apps/api
vercel deploy
```

Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Deploy Web to Vercel

```bash
cd apps/web
vercel deploy
```

Set environment variable:
- `NEXT_PUBLIC_API_URL` (your API URL from previous step)

### Deploy Ingestion to Vercel

```bash
cd apps/ingestion
vercel deploy
```

Set environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `INGESTION_SECRET`

The cron job will run automatically at 2 AM daily.

### Build Mobile App

For production mobile builds, use Expo Application Services (EAS):

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure and build:
   ```bash
   cd apps/mobile
   eas build:configure
   eas build --platform ios
   eas build --platform android
   ```

## Integrating Real Data

The current implementation uses mock data. To integrate real Assemblée nationale data:

1. Research available APIs:
   - [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)
   - Official documentation for API endpoints

2. Update `apps/ingestion/src/assemblee-client.ts`:
   - Replace mock implementation with real API calls
   - Implement proper authentication if needed
   - Handle rate limiting and errors

3. Update transformation logic in `apps/ingestion/src/transform.ts` if needed

4. Test thoroughly with real data

## Troubleshooting

### API returns CORS errors
- Make sure API is running and accessible
- Check CORS headers in API endpoint handlers

### Database connection fails
- Verify Supabase credentials
- Check if your IP is allowed (Supabase has no IP restrictions by default)

### Mobile app can't connect to API
- Make sure API is deployed (localhost won't work on physical devices)
- Update API_URL in mobile app files

### Ingestion fails
- Check Supabase credentials
- Verify database schema is up to date
- Check logs for specific errors

## Next Steps

1. Integrate real Assemblée nationale API
2. Set up monitoring and error tracking
3. Add analytics (optional)
4. Set up automated tests
5. Configure staging environment
6. Set up continuous deployment
