# Database Setup

This directory contains the database schema for Agora.

## Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the schema SQL:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `schema.sql`
   - Execute the SQL

3. (Optional) Seed political group metadata for richer group pages (dates, position, president):
   - In the SQL Editor, run the contents of `seed-political-groups-metadata.sql`
   - This populates `political_groups_metadata` for the 17e législature

4. Get your connection details:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service role key (for server-side operations)
   - Anon key (for client-side operations, if needed)

5. Add these to your environment variables in the API and ingestion apps:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

## Schema Overview

- **sittings**: Parliamentary sessions with date, time, type, and basic info
- **agenda_items**: Individual items on each sitting's agenda
- **source_metadata**: Provenance tracking for data synchronization
- **political_groups_metadata**: Optional metadata for political groups (dates, position, orientation, president) for the group detail pages

## Indexes

- `sittings.date` - For efficient date-based queries
- `agenda_items.sitting_id` - For efficient joins with sittings
- `source_metadata.sitting_id` - For provenance lookups

## Maintenance

The schema includes automatic `updated_at` timestamp management via triggers.

## Migrations

If you have an existing `deputies` table without `date_fin_mandat`, add it with:

```sql
ALTER TABLE deputies ADD COLUMN IF NOT EXISTS date_fin_mandat DATE;
```

If you have an existing `deputies` table without `ref_circonscription` (official circonscription ref for URLs), add it with:

```sql
ALTER TABLE deputies ADD COLUMN IF NOT EXISTS ref_circonscription TEXT;
CREATE INDEX IF NOT EXISTS idx_deputies_ref_circonscription ON deputies(ref_circonscription);
```

If you do not yet have a `circonscriptions` table (single source of truth for constituencies), add it with:

```sql
CREATE TABLE IF NOT EXISTS circonscriptions (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    geometry JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_circonscriptions_updated_at BEFORE UPDATE ON circonscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Then run circonscriptions ingestion (from official data.gouv.fr GeoJSON) and deputies ingestion.

If you already have a `circonscriptions` table without the `geometry` column (for map overlay), add it with:

```sql
ALTER TABLE circonscriptions ADD COLUMN IF NOT EXISTS geometry JSONB;
```

Then re-run circonscriptions ingestion to populate geometry.

To add the foreign key from `deputies.ref_circonscription` to `circonscriptions(id)` (after both tables exist and circonscriptions is populated):

```sql
ALTER TABLE deputies ADD CONSTRAINT fk_deputies_ref_circonscription
    FOREIGN KEY (ref_circonscription) REFERENCES circonscriptions(id) ON DELETE SET NULL;
```

To add the **push_tokens** table (for mobile push notifications):

1. In the Supabase SQL Editor, run the contents of `migrations/push_tokens.sql`.
2. Ensure the API has `CRON_SECRET` (or `PUSH_NOTIFY_SECRET`) set in Vercel for the `/api/cron/notify-scrutins` endpoint.
