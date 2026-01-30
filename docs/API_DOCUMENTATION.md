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

**Note**: The sitting detail response may include a `scrutins` array when votes (scrutins) are linked to that sitting.

---

### Get Scrutins for Date Range

Retrieve roll-call votes (scrutins) for a date range.

**Endpoint**: `GET /scrutins`

**Query Parameters**:

- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format

**Example Request**:

```
GET /api/scrutins?from=2026-01-01&to=2026-01-31
```

**Success Response** (200):

```json
{
  "from": "2026-01-01",
  "to": "2026-01-31",
  "scrutins": [
    {
      "id": "uuid",
      "official_id": "VTANR5L17V2657",
      "sitting_id": "uuid-or-null",
      "date_scrutin": "2025-06-24",
      "numero": "2657",
      "type_vote_code": "SPO",
      "type_vote_libelle": "scrutin public ordinaire",
      "sort_code": "adopté",
      "sort_libelle": "l'Assemblée nationale a adopté",
      "titre": "...",
      "synthese_pour": 121,
      "synthese_contre": 23,
      "synthese_abstentions": 0,
      "synthese_non_votants": 2,
      "official_url": "https://www.assemblee-nationale.fr/dyn/16/scrutins/2657"
    }
  ],
  "source": { "label": "Assemblée nationale - Scrutins" }
}
```

---

### Get Scrutin Details

Retrieve a single scrutin by UUID or official_id, including per-deputy votes.

**Endpoint**: `GET /scrutins/:id`

**Path Parameters**:

- `id`: Scrutin UUID or official_id (e.g. VTANR5L17V2657)

**Success Response** (200): Scrutin object with optional `votes` array of `{ id, scrutin_id, acteur_ref, acteur_nom, position }` (position: pour, contre, abstention, non_votant). `acteur_nom` is present when deputies table is populated.

---

### Get Deputy Profile

Retrieve deputy profile by acteur_ref (e.g. PA842279). Requires deputies table to be populated via ingestion.

**Endpoint**: `GET /deputy/:acteurRef`

**Path Parameters**:

- `acteurRef` (required): Deputy acteur reference (e.g. PA842279)

**Success Response** (200):

```json
{
  "acteur_ref": "PA842279",
  "civil_nom": "Dupont",
  "civil_prenom": "Marie",
  "date_naissance": "1975-03-15",
  "lieu_naissance": "Paris",
  "profession": "Avocate",
  "sexe": "F",
  "parti_politique": null,
  "groupe_politique": "RE",
  "circonscription": "Paris - 5e circonscription",
  "departement": "Paris",
  "date_debut_mandat": "2024-07-01",
  "date_fin_mandat": null,
  "legislature": 17,
  "official_url": "https://www.assemblee-nationale.fr/dyn/deputes/PA842279"
}
```

---

### Get Deputy Voting Record

Retrieve voting record for a deputy by acteur_ref (e.g. PA842279).

**Endpoint**: `GET /deputies/:acteurRef/votes`

**Path Parameters**:

- `acteurRef` (required): Deputy acteur reference (e.g. PA842279)

**Success Response** (200):

```json
{
  "acteur_ref": "PA842279",
  "acteur_nom": "Marie Dupont",
  "votes": [
    {
      "scrutin_id": "uuid",
      "scrutin_titre": "...",
      "date_scrutin": "2025-06-24",
      "position": "pour"
    }
  ]
}
```

---

### Get Political Groups List

Retrieve list of political groups (groupes politiques) with slug, label and deputy count. Derived from deputies with non-null `groupe_politique`.

**Endpoint**: `GET /groups`

**Success Response** (200):

```json
{
  "groups": [
    {
      "slug": "lfi",
      "label": "LFI",
      "deputy_count": 75
    },
    {
      "slug": "renaissance",
      "label": "RENAISSANCE",
      "deputy_count": 169
    }
  ]
}
```

---

### Get Political Group by Slug

Retrieve a single political group by slug (slugified `groupe_politique` label) with its deputies.

**Endpoint**: `GET /groups/:slug`

**Path Parameters**:

- `slug` (required): URL-safe slug of the group (e.g. `lfi`, `renaissance`)

**Success Response** (200):

```json
{
  "slug": "lfi",
  "label": "LFI",
  "deputy_count": 75,
  "deputies": [
    {
      "acteur_ref": "PA123",
      "civil_nom": "Dupont",
      "civil_prenom": "Marie",
      "groupe_politique": "LFI",
      "circonscription": "...",
      "departement": "...",
      "..."
    }
  ]
}
```

**Error Response** (404): Group not found when no deputies have that `groupe_politique` (slug does not match any label).

---

### Get Circonscriptions List

Retrieve list of circonscriptions (electoral constituencies) with id, label and deputy count. Derived from deputies with non-null `circonscription`. Each item has a canonical `id` (e.g. `7505`, `1801`, `2A01`) for use in the detail URL.

**Endpoint**: `GET /circonscriptions`

**Success Response** (200):

```json
{
  "circonscriptions": [
    {
      "id": "7505",
      "label": "Paris - 5e circonscription",
      "deputy_count": 1
    }
  ]
}
```

---

### Get Circonscription by ID

Retrieve a single circonscription by id (canonical circonscription id, e.g. department code + ordinal) with its deputies.

**Endpoint**: `GET /circonscriptions/:id`

**Path Parameters**:

- `id` (required): Canonical circonscription id (e.g. `7505`, `1801`, `2A01`, `97101`)

**Success Response** (200):

```json
{
  "id": "7505",
  "label": "Paris - 5e circonscription",
  "deputy_count": 1,
  "deputies": [
    {
      "acteur_ref": "PA123",
      "civil_nom": "Dupont",
      "civil_prenom": "Marie",
      "groupe_politique": "RENAISSANCE",
      "circonscription": "Paris - 5e circonscription",
      "departement": "Paris",
      "..."
    }
  ]
}
```

**Error Response** (404): Circonscription not found when no deputies match that id.

---

### Get Circonscriptions GeoJSON (map overlay)

Returns a GeoJSON FeatureCollection of all circonscriptions with `id`, `label` in properties and geometry (Polygon/MultiPolygon) for use as an overlay on a map of France. Source: data.gouv.fr contours géographiques des circonscriptions législatives.

**Endpoint**: `GET /circonscriptions/geojson`

**Success Response** (200): `Content-Type: application/geo+json`

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "id": "7505", "label": "Paris - 5e circonscription" },
      "geometry": { "type": "Polygon", "coordinates": [[[2.35, 48.85], ...]] }
    }
  ]
}
```

Only circonscriptions with stored geometry are included. Run circonscriptions ingestion to populate geometry.

---

### Search

Search scrutins (by titre), deputies (by civil_nom, civil_prenom), and groups (by groupe_politique label).

**Endpoint**: `GET /search`

**Query Parameters**:

- `q` (required): Search query, minimum 2 characters
- `type` (optional): One of `scrutins`, `deputies`, `groups`, or `all` (default: `all`)

**Example Request**:

```
GET /api/search?q=budget&type=all
```

**Success Response** (200):

```json
{
  "q": "budget",
  "scrutins": [
    {
      "id": "...",
      "titre": "Projet de loi de finances - Budget 2026",
      "date_scrutin": "2026-01-15",
      "numero": "1234",
      "sort_code": "adopté",
      "..."
    }
  ],
  "deputies": [],
  "groups": []
}
```

Results are limited (e.g. 20 scrutins, 20 deputies, 10 groups). Empty arrays are returned when no matches or when `type` excludes that category.

**Error Response** (400): Missing or too short `q`, or invalid `type`.

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
  id: string; // UUID
  sitting_id: string; // Foreign key to sitting
  original_source_url: string; // URL of original data
  last_synced_at: string; // ISO 8601 timestamp
  checksum: string; // Data integrity checksum
}
```

## Error Codes

| Status | Error               | Description                  |
| ------ | ------------------- | ---------------------------- |
| 400    | BadRequest          | Invalid parameters or format |
| 404    | NotFound            | Resource not found           |
| 405    | MethodNotAllowed    | Wrong HTTP method            |
| 500    | DatabaseError       | Database operation failed    |
| 500    | InternalServerError | Unexpected error             |

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
import { createApiClient } from "@agora/shared";

const client = createApiClient("https://your-api.vercel.app/api");

// Fully typed responses
const agenda = await client.getAgenda("2026-01-22");
const range = await client.getAgendaRange("2026-01-20", "2026-01-27");
const sitting = await client.getSitting("550e8400-...");
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
