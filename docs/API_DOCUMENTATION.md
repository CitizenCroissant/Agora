# API Documentation

REST API documentation for Agora.

## Base URL

**Production**: `https://your-api.vercel.app/api`  
**Development**: `http://localhost:3000/api`

## Common Headers

All endpoints support:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Cache-Control: s-maxage=300, stale-while-revalidate
```

## Endpoints

### Get Agenda for Date

Retrieve all sittings and agenda items for a specific date.

**Endpoint**: `GET /agenda`

**Query Parameters**:
- `date` (required): Date in YYYY-MM-DD format

**Example Request**:
```
GET /api/agenda?date=2026-01-22
```

**Success Response** (200):
```json
{
  "date": "2026-01-22",
  "sittings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "official_id": "SEANCE-2026-01-22-001",
      "date": "2026-01-22",
      "start_time": "15:00:00",
      "end_time": "19:00:00",
      "type": "seance_publique",
      "title": "Séance publique",
      "description": "Séance publique - 3 point(s) à l'ordre du jour",
      "location": "Palais Bourbon, Paris",
      "time_range": "15:00 - 19:00",
      "agenda_items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "sitting_id": "550e8400-e29b-41d4-a716-446655440000",
          "scheduled_time": "15:00:00",
          "title": "Questions au Gouvernement",
          "description": "Questions au Gouvernement",
          "category": "questions_gouvernement",
          "reference_code": null,
          "official_url": null
        }
      ]
    }
  ],
  "source": {
    "label": "Données officielles de l'Assemblée nationale",
    "last_updated_at": "2026-01-22T08:30:00.000Z"
  }
}
```

**Error Response** (400):
```json
{
  "error": "BadRequest",
  "message": "Invalid date format. Use YYYY-MM-DD",
  "status": 400
}
```

**Error Response** (500):
```json
{
  "error": "DatabaseError",
  "message": "Failed to fetch sittings",
  "status": 500
}
```

---

### Get Agenda for Date Range

Retrieve agendas for multiple dates.

**Endpoint**: `GET /agenda/range`

**Query Parameters**:
- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format

**Example Request**:
```
GET /api/agenda/range?from=2026-01-20&to=2026-01-27
```

**Success Response** (200):
```json
{
  "from": "2026-01-20",
  "to": "2026-01-27",
  "agendas": [
    {
      "date": "2026-01-20",
      "sittings": [...],
      "source": {
        "label": "Données officielles de l'Assemblée nationale",
        "last_updated_at": "2026-01-20T08:30:00.000Z"
      }
    },
    {
      "date": "2026-01-21",
      "sittings": [...],
      "source": {
        "label": "Données officielles de l'Assemblée nationale",
        "last_updated_at": "2026-01-21T08:30:00.000Z"
      }
    }
  ]
}
```

**Constraints**:
- `from` must be before or equal to `to`
- Maximum range: Not enforced, but recommended < 90 days

---

### Get Sitting Details

Retrieve detailed information for a specific sitting.

**Endpoint**: `GET /sittings/:id`

**Path Parameters**:
- `id` (required): Sitting UUID

**Example Request**:
```
GET /api/sittings/550e8400-e29b-41d4-a716-446655440000
```

**Success Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "official_id": "SEANCE-2026-01-22-001",
  "date": "2026-01-22",
  "start_time": "15:00:00",
  "end_time": "19:00:00",
  "type": "seance_publique",
  "title": "Séance publique",
  "description": "Séance publique - 3 point(s) à l'ordre du jour",
  "location": "Palais Bourbon, Paris",
  "time_range": "15:00 - 19:00",
  "agenda_items": [...],
  "source_metadata": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "sitting_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_source_url": "https://www2.assemblee-nationale.fr/agendas/les-agendas/2026-01-22",
    "last_synced_at": "2026-01-22T08:30:00.000Z",
    "checksum": "abc123def456..."
  }
}
```

**Error Response** (404):
```json
{
  "error": "NotFound",
  "message": "Sitting not found",
  "status": 404
}
```

---

## Data Types

### Sitting

```typescript
{
  id: string;                    // UUID
  official_id: string;           // Official identifier
  date: string;                  // YYYY-MM-DD
  start_time?: string;           // HH:MM:SS
  end_time?: string;             // HH:MM:SS
  type: string;                  // e.g., 'seance_publique'
  title: string;                 // Human-readable title
  description: string;           // Description
  location?: string;             // Physical location
  time_range?: string;           // Formatted time range
  agenda_items: AgendaItem[];    // List of agenda items
}
```

### AgendaItem

```typescript
{
  id: string;                    // UUID
  sitting_id: string;            // Foreign key to sitting
  scheduled_time?: string;       // HH:MM:SS
  title: string;                 // Item title
  description: string;           // Item description
  category: string;              // Category/type
  reference_code?: string;       // Official reference
  official_url?: string;         // Link to official document
}
```

### SourceMetadata

```typescript
{
  id: string;                    // UUID
  sitting_id: string;            // Foreign key to sitting
  original_source_url: string;   // URL of original data
  last_synced_at: string;        // ISO 8601 timestamp
  checksum: string;              // Data integrity checksum
}
```

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | BadRequest | Invalid parameters or format |
| 404 | NotFound | Resource not found |
| 405 | MethodNotAllowed | Wrong HTTP method |
| 500 | DatabaseError | Database operation failed |
| 500 | InternalServerError | Unexpected error |

## Rate Limiting

Currently no rate limiting enforced. Responses are cached at the edge for 5 minutes.

**Best Practices**:
- Cache responses on client side
- Use appropriate date ranges
- Don't poll more frequently than every 5 minutes

## CORS

All endpoints support CORS with `Access-Control-Allow-Origin: *`. Safe for use from web and mobile apps.

## Caching

All GET endpoints include caching headers:
```
Cache-Control: s-maxage=300, stale-while-revalidate
```

This means:
- Responses cached for 5 minutes at edge
- Stale content served while revalidating
- Good balance between freshness and performance

## TypeScript Support

Use the `@agora/shared` package for full TypeScript support:

```typescript
import { createApiClient } from '@agora/shared';

const client = createApiClient('https://your-api.vercel.app/api');

// Fully typed responses
const agenda = await client.getAgenda('2026-01-22');
const range = await client.getAgendaRange('2026-01-20', '2026-01-27');
const sitting = await client.getSitting('550e8400-...');
```

## Data Source

All data is sourced from the official French National Assembly open data portal:

**Primary Source**: 
- URL: `http://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip`
- Legislature: 17th (2024-2029)
- Format: ZIP archive with individual JSON files per meeting
- License: Open Data (Licence Ouverte / Etalab)

**Update Frequency**:
- The official data is updated regularly by the Assemblée nationale
- Our ingestion system runs daily at 2 AM (configurable)
- Data is cached at the edge for 5 minutes with stale-while-revalidate

**Data Coverage**:
- Public sessions (séances publiques)
- Commission meetings
- Parliamentary group meetings
- All legislative work with full provenance tracking

**Data Quality**:
- Each sitting includes original source URL
- Checksums track data changes
- Full audit trail via `last_synced_at` timestamps
- Official identifiers preserved (`official_id` field)

**Attribution**:
All data © Assemblée nationale. When displaying this data, please include:
```
Source: Assemblée nationale (data.assemblee-nationale.fr)
```

## Changelog

### v0.1.0 (2026-01-21)
- Initial API release
- Three core endpoints
- CORS support
- Edge caching
- Real Assemblée nationale data integration
