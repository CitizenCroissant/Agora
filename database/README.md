# Database Setup

This directory contains the database schema for Agora.

## Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the schema SQL:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `schema.sql`
   - Execute the SQL

3. Get your connection details:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service role key (for server-side operations)
   - Anon key (for client-side operations, if needed)

4. Add these to your environment variables in the API and ingestion apps:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

## Schema Overview

- **sittings**: Parliamentary sessions with date, time, type, and basic info
- **agenda_items**: Individual items on each sitting's agenda
- **source_metadata**: Provenance tracking for data synchronization

## Indexes

- `sittings.date` - For efficient date-based queries
- `agenda_items.sitting_id` - For efficient joins with sittings
- `source_metadata.sitting_id` - For provenance lookups

## Maintenance

The schema includes automatic `updated_at` timestamp management via triggers.
