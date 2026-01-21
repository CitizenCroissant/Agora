# Architecture

Technical architecture documentation for Agora.

## Overview

Agora is a full-stack application with a serverless architecture:

- **Database**: Supabase (managed Postgres)
- **API**: Serverless functions (Vercel Functions)
- **Web**: Next.js (React)
- **Mobile**: React Native with Expo
- **Ingestion**: Scheduled serverless functions

## System Architecture

```
┌─────────────┐         ┌─────────────┐
│   Web App   │         │ Mobile App  │
│  (Next.js)  │         │   (Expo)    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Serverless API │
         │    (Vercel)     │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    Supabase     │
         │   (Postgres)    │
         └────────┬────────┘
                  ▲
                  │
         ┌────────┴────────┐
         │    Ingestion    │
         │   (Scheduled)   │
         └─────────────────┘
                  ▲
                  │
         ┌────────┴────────┐
         │   Assemblée     │
         │ nationale Data  │
         └─────────────────┘
```

## Components

### 1. Shared Package (`packages/shared`)

**Purpose**: Common code shared across all applications

**Contents**:
- TypeScript types for domain models
- API client with typed methods
- Utility functions (date formatting, etc.)

**Key Files**:
- `types.ts` - Domain types (Sitting, AgendaItem, etc.)
- `api-client.ts` - HTTP client for API calls
- `utils.ts` - Shared utilities

**Why**: Ensures consistency across web and mobile apps, reduces code duplication

### 2. Database (`database/`)

**Technology**: Supabase (managed Postgres)

**Schema**:
- `sittings` - Parliamentary sessions
- `agenda_items` - Items on each sitting's agenda
- `source_metadata` - Provenance tracking

**Key Features**:
- UUID primary keys
- Foreign key relationships
- Indexes on date and sitting_id
- Automatic updated_at timestamps
- Ready for Row Level Security (RLS)

### 3. API Layer (`apps/api`)

**Technology**: Vercel Functions (Node.js)

**Endpoints**:
- `GET /api/agenda?date=YYYY-MM-DD` - Single date agenda
- `GET /api/agenda/range?from=...&to=...` - Date range
- `GET /api/sittings/:id` - Sitting details

**Key Features**:
- CORS enabled for all origins
- HTTP caching (5 minutes)
- Error handling with typed errors
- Supabase service role access

**Why Serverless**: 
- No server management
- Auto-scaling
- Cost-effective for variable load
- Global edge deployment

### 4. Ingestion (`apps/ingestion`)

**Technology**: Serverless functions + Cron

**Features**:
- Fetches official Assemblée data
- Transforms to domain model
- Upserts to Supabase
- Change detection via checksums
- Protected endpoint with secret

**Schedule**: Daily at 2 AM (configurable)

**CLI Usage**:
```bash
npm run ingest -- --date 2026-01-22
npm run ingest -- --from 2026-01-20 --to 2026-01-27
npm run ingest -- --dry-run
```

### 5. Web Application (`apps/web`)

**Technology**: Next.js 15 (App Router)

**Pages**:
- `/` - Today's agenda
- `/timeline` - Calendar view
- `/sitting/[id]` - Sitting details
- `/about` - About page
- `/sources` - Data sources

**Architecture**:
- Client-side rendering for dynamic content
- CSS Modules for styling
- Shared API client for data fetching
- Responsive design

### 6. Mobile Application (`apps/mobile`)

**Technology**: React Native + Expo

**Screens**:
- Today Tab - Current agenda
- Timeline Tab - Calendar view
- About Tab - Information
- Sitting Detail - Full agenda

**Navigation**: Expo Router (file-based)

**Architecture**:
- Native components
- Same API client as web
- Platform-specific styling
- Deep linking ready

## Data Flow

### Read Path (User → Data)

1. User opens web/mobile app
2. App calls API endpoint via shared client
3. API queries Supabase
4. API transforms and groups data
5. API returns JSON with provenance
6. App renders UI

### Write Path (Official Data → Database)

1. Cron triggers ingestion function
2. Function fetches Assemblée data
3. Transforms to domain model
4. Calculates checksum
5. Upserts to Supabase
6. Updates source metadata

## Security

### API Layer
- Public read-only endpoints
- No authentication required (public data)
- Rate limiting at edge (via Vercel)
- CORS configured for all origins

### Ingestion
- Protected by secret key
- Service role access to Supabase
- Scheduled execution only

### Database
- Service role for server-side operations
- RLS ready (currently disabled)
- No direct client access

## Performance

### Caching Strategy
- API responses cached for 5 minutes
- `s-maxage` for edge caching
- `stale-while-revalidate` for UX

### Database
- Indexes on frequently queried columns
- Efficient joins with foreign keys
- Minimal N+1 queries

### Frontend
- Code splitting (automatic with Next.js)
- Lazy loading of pages
- Optimized bundle size

## Scalability

### Current Scale
- Handles ~1000 requests/day comfortably
- Database: ~1000 sittings + ~10000 agenda items
- Storage: <10 MB

### Growth Path
- API: Auto-scales with Vercel
- Database: Supabase scales automatically
- CDN: Global edge caching
- Can handle 100x traffic without changes

## Monitoring

### Recommended Tools
- **Logs**: Vercel Dashboard
- **Errors**: Sentry (optional)
- **Analytics**: Vercel Analytics or Plausible
- **Uptime**: UptimeRobot or similar

### Key Metrics
- API response time
- Error rate
- Ingestion success rate
- Database query performance

## Development Workflow

1. Make changes in relevant package
2. Build shared package if modified
3. Test locally with dev servers
4. Deploy to staging (optional)
5. Deploy to production

## Technology Choices

### Why Supabase?
- Managed Postgres (no ops burden)
- Good free tier
- Real-time capabilities (future)
- Built-in authentication (future)
- Easy to migrate from if needed

### Why Serverless?
- No server management
- Pay per use
- Auto-scaling
- Global deployment
- Perfect for variable/low traffic

### Why Vercel?
- Excellent Next.js support
- Edge functions
- Built-in cron
- Easy deployment
- Good DX

### Why Expo?
- Best React Native DX
- OTA updates
- Easy builds (EAS)
- Cross-platform
- Active community

## Future Enhancements

### Short Term
- Real Assemblée API integration
- Error boundaries
- Loading skeletons
- Offline support (mobile)

### Medium Term
- Push notifications (mobile)
- Search functionality
- Filters and categories
- User preferences

### Long Term
- Real-time updates
- Historical data
- Analytics dashboard
- Deputy profiles
- Vote tracking
