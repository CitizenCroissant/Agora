-- Agora Database Schema for Supabase
-- This schema represents the data model for Assemblée nationale agenda items

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: sittings
-- Represents a parliamentary sitting/session
CREATE TABLE sittings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on date for efficient agenda queries
CREATE INDEX idx_sittings_date ON sittings(date);
CREATE INDEX idx_sittings_official_id ON sittings(official_id);

-- Table: agenda_items
-- Represents individual items on a sitting's agenda
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sitting_id UUID NOT NULL REFERENCES sittings(id) ON DELETE CASCADE,
    scheduled_time TIME,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    reference_code TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on sitting_id for efficient joins
CREATE INDEX idx_agenda_items_sitting_id ON agenda_items(sitting_id);

-- Table: source_metadata
-- Tracks provenance and synchronization information
CREATE TABLE source_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sitting_id UUID NOT NULL UNIQUE REFERENCES sittings(id) ON DELETE CASCADE,
    original_source_url TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on sitting_id for efficient lookups (unique constraint already provides an index)
-- CREATE INDEX idx_source_metadata_sitting_id ON source_metadata(sitting_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_sittings_updated_at BEFORE UPDATE ON sittings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_items_updated_at BEFORE UPDATE ON agenda_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_metadata_updated_at BEFORE UPDATE ON source_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- For now, we'll allow public read access, managed through the API layer
-- Uncomment and configure these when ready to expose Supabase directly to clients

-- ALTER TABLE sittings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE source_metadata ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow public read access" ON sittings FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON agenda_items FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON source_metadata FOR SELECT USING (true);
