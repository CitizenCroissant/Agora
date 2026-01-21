# Quick Start Guide

Get Agora running in 10 minutes! ⚡

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Supabase account (free at [supabase.com](https://supabase.com))

## Step-by-Step Setup

### 1. Install Dependencies (2 min)

```bash
npm install
```

This installs dependencies for all packages in the monorepo.

### 2. Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)
3. Go to the SQL Editor
4. Copy the entire contents of `database/schema.sql`
5. Paste and click "Run"
6. Go to Settings > API and copy:
   - Project URL
   - `service_role` key (secret!)

### 3. Configure Environment Variables (2 min)

**API Configuration:**
```bash
cd apps/api
cp env.example .env.local
```

Edit `apps/api/.env.local`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Ingestion Configuration:**
```bash
cd apps/ingestion
cp env.example .env.local
```

Edit `apps/ingestion/.env.local`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
INGESTION_SECRET=any-random-string-for-security
```

**Web Configuration:**
```bash
cd apps/web
cp env.example .env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Build Shared Package (1 min)

```bash
cd packages/shared
npm run build
```

### 5. Seed Database with Mock Data (1 min)

```bash
cd apps/ingestion
npm run ingest -- --date 2026-01-22
```

You should see output like:
```
Starting ingestion...
Found 1 seance(s)
Upserted sitting: xxx
Inserted 2 agenda item(s)
Ingestion complete!
```

### 6. Start Development Servers (1 min)

Open **two terminal windows**:

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
```

Wait for: `Ready on http://localhost:3000`

**Terminal 2 - Web:**
```bash
cd apps/web
npm run dev
```

Wait for: `Ready on http://localhost:3000` (or 3001)

### 7. Open in Browser

Go to: **http://localhost:3000** (or the port shown)

You should see the Agora homepage with the mock data you seeded!

## Verification

✅ You should see:
- Today's date at the top
- Date navigation buttons
- One or more "séance" cards
- Agenda items listed

## What's Next?

### Try the Features

1. **Navigate dates**: Click previous/next day buttons
2. **View timeline**: Click "Calendrier" in navigation
3. **See details**: Click on any séance card
4. **Check sources**: Click "À propos" or "Sources"

### Add More Mock Data

```bash
cd apps/ingestion
npm run ingest -- --date 2026-01-23
npm run ingest -- --date 2026-01-24
```

### Mobile App (Optional)

1. Install Expo CLI:
   ```bash
   npm install -g expo-cli
   ```

2. Start mobile app:
   ```bash
   cd apps/mobile
   npm start
   ```

3. Scan QR code with Expo Go app

**Note**: Update the `API_URL` in mobile files to point to your deployed API (localhost won't work on physical devices).

## Common Issues

### "Cannot find module '@agora/shared'"

**Solution**: Build the shared package first
```bash
cd packages/shared
npm run build
```

### "Failed to fetch agenda" / CORS errors

**Solution**: Make sure the API is running on port 3001
```bash
cd apps/api
npm run dev
```

### "Database connection failed"

**Solution**: Check your Supabase credentials in `.env.local`
- Verify SUPABASE_URL is correct
- Verify SUPABASE_SERVICE_KEY is the `service_role` key (not `anon` key)

### Web app shows port conflict

**Solution**: API and Web need different ports
- API uses 3000 by default
- Web will auto-increment to 3001 if 3000 is taken
- Update `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` if needed

## Ready for Production?

See the complete [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for:
- Deploying to Vercel
- Setting up the ingestion cron job
- Integrating real Assemblée nationale data
- Building the mobile app for stores

## Need Help?

1. Check [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed instructions
2. Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
3. See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for API info
4. Open an issue on GitHub

## Success! 🎉

If you can see the agenda data, you've successfully set up Agora!

Now you can:
- Explore the codebase
- Make changes and see them live
- Add more features
- Deploy to production
- Integrate real data

Happy coding! 🏛️
