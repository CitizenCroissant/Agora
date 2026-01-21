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

2. Copy `env.example` to `.env.local` and configure:
   ```bash
   cp env.example .env.local
   ```

3. Set the API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

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
