# Web App

Next.js web application for Agora.

## Features

- **Today View**: Current day's agenda with navigation
- **Timeline**: Scrollable date list showing past and future agendas
- **Sitting Details**: Detailed view of individual sittings with full agenda
- **About & Sources**: Transparency pages explaining data sources and methodology

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- CSS Modules

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API URL (optional):
   - Copy `env.example` to `.env.local`:
     ```bash
     cp env.example .env.local
     ```
   - The API URL defaults to `http://localhost:3000/api`
   - To use a different URL, set in `.env.local`:
     ```
     NEXT_PUBLIC_API_URL=https://your-api.vercel.app/api
     ```
   - Configuration is centralized in `lib/config.ts`

3. Run development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000` (or next available port)

## Pages

- `/` - Today's agenda (home)
- `/timeline` - Calendar view with date range
- `/sitting/[id]` - Detailed sitting view
- `/about` - About page
- `/sources` - Data sources and glossary

## Design

The design follows French government color scheme:
- Primary: #0055a4 (French blue)
- Secondary: #ef4135 (French red)
- Clean, accessible interface with focus on readability

## Deployment

Build for production:

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
vercel deploy
```
