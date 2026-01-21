# Agora - AI Assistant Guide

This file helps AI assistants understand and work with the Agora codebase effectively.

## Project Overview

**Agora** is a civic transparency application that displays French Assemblée nationale (parliament) agendas using official open data. It's a full-stack TypeScript monorepo with web and mobile apps.

**Purpose**: Make parliamentary activities transparent and accessible to citizens.

## Tech Stack at a Glance

- **Monorepo**: Turbo + npm workspaces
- **Language**: TypeScript (strict mode)
- **Backend**: Serverless functions (Vercel), Supabase (Postgres)
- **Web**: Next.js 15 (App Router), React 19, CSS Modules
- **Mobile**: React Native + Expo, Expo Router
- **Testing**: Vitest (web/shared/api), Jest (mobile)
- **Linting**: ESLint + TypeScript
- **Data Source**: data.assemblee-nationale.fr (French Parliament open data)

## Monorepo Structure

```
Agora/
├── packages/
│   └── shared/              # Core package - MUST build first
│       ├── src/
│       │   ├── types.ts     # Domain types (Sitting, AgendaItem, etc.)
│       │   ├── api-client.ts # Typed HTTP client
│       │   └── utils.ts     # Date formatting, utilities
│       └── package.json     # @agora/shared
│
├── apps/
│   ├── api/                 # Serverless API (Vercel Functions)
│   │   ├── api/
│   │   │   ├── agenda.ts    # GET /api/agenda?date=YYYY-MM-DD
│   │   │   ├── agenda/range.ts # GET /api/agenda/range?from=...&to=...
│   │   │   └── sittings/[id].ts # GET /api/sittings/:id
│   │   └── lib/
│   │       ├── supabase.ts  # DB client
│   │       └── types.ts     # API-specific types
│   │
│   ├── ingestion/           # Data ingestion service
│   │   ├── api/ingest.ts    # Webhook endpoint
│   │   └── src/
│   │       ├── assemblee-client.ts # Fetch from official API
│   │       ├── transform.ts # Transform to domain model
│   │       └── ingest.ts    # CLI + orchestration
│   │
│   ├── web/                 # Next.js web app
│   │   └── app/
│   │       ├── page.tsx     # Today's agenda (/)
│   │       ├── timeline/    # Calendar view
│   │       ├── sitting/[id]/ # Sitting details
│   │       ├── about/       # About page
│   │       └── sources/     # Data sources
│   │
│   └── mobile/              # React Native + Expo
│       └── app/
│           ├── (tabs)/      # Bottom tabs navigation
│           │   ├── index.tsx    # Today tab
│           │   ├── timeline.tsx # Calendar tab
│           │   └── about.tsx    # About tab
│           └── sitting/[id].tsx # Sitting detail
│
├── database/
│   └── schema.sql           # Supabase schema (sittings, agenda_items)
│
└── docs/                    # Documentation
    ├── SETUP_GUIDE.md
    ├── ARCHITECTURE.md
    ├── API_DOCUMENTATION.md
    └── TESTING_AND_LINTING.md
```

## Key Concepts

### Domain Model

**Sitting** (séance): A parliamentary session on a specific date
- Has UUID, date, type (morning/afternoon/evening), hemicycle
- Contains multiple agenda items

**AgendaItem**: Individual item on a sitting's agenda
- Belongs to a sitting
- Has order, title, time, status

**Source Metadata**: Tracks data provenance
- Official URL, checksum for change detection

### Data Flow

1. **Ingestion** (daily cron): Assemblée API → Transform → Supabase
2. **API**: Supabase → Aggregate/format → JSON response
3. **Clients**: API → Shared client → UI components

## Turbo Monorepo Usage

### Run Commands from Root

```bash
# Development
npm run dev                  # All apps (can be overwhelming)
npm run dev -- --filter=api  # Just API
npm run dev -- --filter=web  # Just web app

# Building
npm run build                # All packages (respects dependencies)
npm run build -- --filter=shared  # Just shared package

# Testing
npm run test                 # All tests
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage

# Linting
npm run lint                 # All packages
npm run lint -- --filter=web # Specific package

# Utilities
npm run clean                # Remove build artifacts
```

### Dependency Chain

**IMPORTANT**: `packages/shared` MUST be built before apps can use it.

```
packages/shared (build first)
    ↓
apps/* (depend on @agora/shared)
```

Turbo handles this automatically via `"dependsOn": ["^build"]`.

### Traditional Commands (Alternative)

```bash
# Run in specific package
npm run dev -w apps/web
npm run build -w packages/shared

# Or cd into directory
cd apps/api && npm run dev
```

## Common Tasks

### 1. Starting Development

```bash
# First time setup
npm install
npm run build -- --filter=shared  # Build shared package
npm run dev -- --filter=api --filter=web  # Start API + Web
```

### 2. Making Changes to Shared Package

```bash
# Edit packages/shared/src/*
cd packages/shared
npm run build  # Or npm run dev for watch mode
# Now apps will see the changes
```

### 3. Adding a New API Endpoint

1. Create file: `apps/api/api/your-endpoint.ts`
2. Export handler: `export default async (req, res) => { ... }`
3. Use shared types from `@agora/shared`
4. Test locally: `curl http://localhost:3001/api/your-endpoint`
5. Update `docs/API_DOCUMENTATION.md`

### 4. Adding a New Page (Web)

1. Create file: `apps/web/app/your-page/page.tsx`
2. Create CSS: `apps/web/app/your-page/your-page.module.css`
3. Import and use: `import styles from './your-page.module.css'`
4. Use `@agora/shared` API client for data

### 5. Ingesting Data

```bash
cd apps/ingestion
npm run ingest -- --date 2026-01-22        # Single date
npm run ingest -- --from 2026-01-20 --to 2026-01-27  # Range
npm run ingest -- --dry-run                # Test without writing
```

### 6. Running Tests

```bash
npm run test                    # All packages
npm run test -- --filter=shared # Specific package
npm run test:watch              # Watch mode (TDD)
npm run test:coverage           # Coverage report
```

### 7. Checking Types and Linting

```bash
npm run lint                    # Lint all
cd apps/web && npx eslint . --fix  # Fix issues
tsc --noEmit                    # Type check without build
```

## Important Conventions

### TypeScript

- **Strict mode**: Always enabled
- **No `any`**: Use proper types or `unknown`
- **Export types**: From appropriate package (shared for domain types)
- **Import from `@agora/shared`**: Not relative paths for shared code

### React Components

- **Functional components only**: Use hooks
- **Props typing**: Always define interface
- **Naming**: PascalCase for components
- **File structure**: One component per file

### CSS (Web)

- **CSS Modules**: Every page/component has `.module.css`
- **Naming**: `styles.variableName` (camelCase)
- **Responsive**: Mobile-first approach
- **No global styles**: Except `globals.css` for resets

### React Native (Mobile)

- **StyleSheet.create**: For all styles
- **Platform-specific**: Use `Platform.OS` when needed
- **Navigation**: Expo Router file-based routing

### API

- **REST conventions**: GET for reads, POST for writes
- **Status codes**: 200 (success), 400 (bad request), 500 (server error)
- **CORS**: Already configured for all origins
- **Caching**: 5-minute cache on responses
- **Error handling**: Use typed errors from `lib/errors.ts`

### Commits

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, semicolons
- `refactor:` Code restructuring
- `test:` Adding/updating tests
- `chore:` Maintenance, deps

## Environment Variables

### API (`apps/api/.env.local`)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

### Ingestion (`apps/ingestion/.env.local`)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
INGESTION_SECRET=your-secret-here
```

### Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Mobile
- Hardcoded in components (should be env vars - future improvement)
- Points to deployed API or local IP for dev

## Testing Strategy

### What to Test
- **Shared package**: Types, utilities, API client
- **API**: Endpoint logic, error handling
- **Web/Mobile**: Component rendering, user interactions

### Test Files
- Co-located: `__tests__/` folder next to source
- Naming: `*.test.ts` or `*.test.tsx`
- Vitest: web, api, shared
- Jest: mobile (React Native compatibility)

### Running Tests
```bash
npm run test              # Run once
npm run test:watch        # TDD mode
npm run test:coverage     # Coverage report
```

## Gotchas & Important Notes

### 1. Build Shared First!
Always build `packages/shared` before running apps:
```bash
cd packages/shared && npm run build
```
Or use: `npm run build -- --filter=shared`

### 2. Port Conflicts
- API runs on port 3000 (or 3001)
- Web runs on port 3000 (or next available)
- Check which port is actually used in terminal output

### 3. Supabase Credentials
- Use **service_role** key (not anon key) for server-side
- Never commit `.env.local` files (gitignored)
- Each app needs its own `.env.local`

### 4. API Must Be Running
Web and mobile apps need the API running to fetch data.
Start API first: `npm run dev -- --filter=api`

### 5. Date Formats
- Always use `YYYY-MM-DD` format
- Utilities in `packages/shared/src/utils.ts`
- French locale for display: `formatDateLong()`

### 6. Turbo Caching
Turbo caches build outputs. If things seem stale:
```bash
npm run build -- --force  # Ignore cache
npm run clean             # Clean all build artifacts
```

### 7. TypeScript Errors in Shared
If apps can't find `@agora/shared` types:
1. Check `packages/shared/dist/` exists
2. Rebuild: `cd packages/shared && npm run build`
3. Restart your IDE's TypeScript server

### 8. Mobile Dev Server
For physical devices, update API_URL to your machine's IP:
```typescript
const API_URL = 'http://192.168.1.xxx:3001/api'
```
Localhost won't work on real devices.

### 9. Database Schema Changes
After modifying `database/schema.sql`:
1. Run in Supabase SQL Editor
2. Or use migration tools (not set up yet)
3. Update types in `packages/shared/src/types.ts`

## File Locations Quick Reference

| Need to... | File Location |
|------------|---------------|
| Add domain type | `packages/shared/src/types.ts` |
| Add utility function | `packages/shared/src/utils.ts` |
| Add API endpoint | `apps/api/api/your-name.ts` |
| Add web page | `apps/web/app/your-page/page.tsx` |
| Add mobile screen | `apps/mobile/app/your-screen.tsx` |
| Modify DB schema | `database/schema.sql` |
| Update API docs | `docs/API_DOCUMENTATION.md` |
| Add test | `src/__tests__/your-file.test.ts` |
| Configure linting | `.eslintrc.js` (root or app-specific) |
| Configure Turbo | `turbo.json` |

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)
- Runs on: push, PR
- Steps: Install → Build → Lint → Test
- Must pass before merge

### Deployment
- **API**: Deploy to Vercel (auto from main branch)
- **Web**: Deploy to Vercel (auto from main branch)
- **Ingestion**: Deploy to Vercel with cron
- **Mobile**: Build with EAS, submit to stores

## Data Sources

**Official API**: `https://data.assemblee-nationale.fr/api/v1/`
- Endpoint: `/agenda/` (date-based)
- Documentation: Available at data.assemblee-nationale.fr
- Rate limits: Unknown (seems generous)
- Format: JSON with nested structure

## Current Status

✅ **Working**:
- All infrastructure and architecture
- API with 3 endpoints
- Web app (all pages)
- Mobile app (all screens)
- Data ingestion (with real data)
- Testing framework
- Linting setup
- CI/CD pipeline

🚧 **In Progress**:
- Integration testing
- Error boundaries
- Loading states

📋 **Future**:
- Search functionality
- Push notifications
- User preferences
- Deputy profiles
- Vote tracking

## Useful Commands Reference

```bash
# Development
npm run dev                           # All apps
npm run dev -- --filter=api          # Just API
npm run dev -- --filter=web          # Just web

# Building
npm run build                         # Everything
npm run build -- --filter=shared     # Just shared
npm run build -- --force             # Ignore cache

# Testing
npm run test                          # All tests
npm run test -- --filter=shared      # One package
npm run test:watch                    # TDD mode
npm run test:coverage                 # Coverage

# Linting
npm run lint                          # All packages
npm run lint -- --filter=web         # One package

# Utilities
npm run clean                         # Clean builds
npx turbo run build --dry-run        # See what would run

# Workspaces
npm run <script> -w apps/web         # Run in specific workspace
npm install <pkg> -w packages/shared # Install in specific workspace

# Ingestion
cd apps/ingestion
npm run ingest -- --date 2026-01-22
npm run ingest -- --from 2026-01-20 --to 2026-01-27
npm run ingest -- --dry-run
```

## When Helping Users

### Before Making Changes
1. Read relevant files first
2. Understand the monorepo structure
3. Check if shared package needs rebuilding
4. Verify types exist in correct location

### Making Changes
1. Use existing patterns and conventions
2. Update types if changing data structures
3. Maintain TypeScript strictness
4. Follow existing code style
5. Update documentation if needed

### After Changes
1. Rebuild shared if modified
2. Run tests: `npm run test`
3. Run linter: `npm run lint`
4. Check TypeScript: `tsc --noEmit`
5. Test in actual browser/device

### Suggesting Improvements
1. Consider impact on all packages
2. Maintain backward compatibility
3. Update relevant documentation
4. Consider mobile and web
5. Keep it simple and maintainable

## Architecture Principles

1. **Shared First**: Common code goes in `packages/shared`
2. **Type Safety**: Strong typing throughout
3. **Serverless**: No servers to manage
4. **REST API**: Simple, standard HTTP
5. **Official Data**: Always cite sources
6. **Transparency**: Open source, clear provenance
7. **Mobile & Web**: Feature parity where possible

## Getting Help

- **Setup**: `docs/SETUP_GUIDE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **API Reference**: `docs/API_DOCUMENTATION.md`
- **Testing**: `docs/TESTING_AND_LINTING.md`
- **Contributing**: `CONTRIBUTING.md`
- **Quick Start**: `QUICKSTART.md`

## Summary for AI Assistants

This is a **Turbo monorepo** with a **shared package** that must be built before apps work. It uses **TypeScript strictly**, follows **REST conventions**, and targets both **web and mobile**. Always respect the **domain model** (Sitting, AgendaItem), use the **shared API client**, and maintain **type safety**. When modifying code, **rebuild shared**, **run tests**, and **lint**. The project prioritizes **transparency**, **simplicity**, and **maintainability**.

---

**Last Updated**: Jan 21, 2026
**Version**: 0.1.0
