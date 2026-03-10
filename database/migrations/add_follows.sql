-- Table: follows
-- "I'm following this": user (by device_id) subscribes to a deputy, bill, or group.
-- Used for recurring use and future push/email (e.g. "your followed deputy voted").
-- Identity is lightweight: device_id (client-generated UUID in localStorage); no auth required.
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    follow_type TEXT NOT NULL CHECK (follow_type IN ('deputy', 'bill', 'group')),
    follow_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, follow_type, follow_id)
);

CREATE INDEX idx_follows_device_id ON follows(device_id);
CREATE INDEX idx_follows_type_id ON follows(follow_type, follow_id);

CREATE TRIGGER update_follows_updated_at
    BEFORE UPDATE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE follows IS 'User follows: deputy (acteur_ref), bill (dossier UUID), or group (slug). Keyed by device_id for lightweight anonymous identity.';
