-- Push tokens for mobile notifications (Expo). Run in Supabase SQL Editor if not already applied via schema.sql.
-- Requires: update_updated_at_column() and uuid_generate_v4() (from schema.sql).

CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expo_push_token TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL DEFAULT 'all' CHECK (topic IN ('all', 'my_deputy')),
    deputy_acteur_ref TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_topic_deputy ON push_tokens(topic, deputy_acteur_ref);

DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
