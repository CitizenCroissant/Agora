-- Agora Database Schema for Supabase
-- This schema represents the data model for Assemblée nationale agenda items

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: organes
-- Parliamentary organs: commissions permanentes, spéciales, d'enquête, délégations, etc.
-- Source: AMO open data. Required for commission reunions (sittings.organe_ref) and deputy membership.
CREATE TABLE organes (
    id TEXT PRIMARY KEY,
    libelle TEXT,
    libelle_abrege TEXT,
    type_organe TEXT NOT NULL,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organes_type_organe ON organes(type_organe);

CREATE TRIGGER update_organes_updated_at BEFORE UPDATE ON organes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: sittings
-- Represents a parliamentary sitting/session (séance publique or commission reunion)
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
    organe_ref TEXT REFERENCES organes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on date for efficient agenda queries
CREATE INDEX idx_sittings_date ON sittings(date);
CREATE INDEX idx_sittings_official_id ON sittings(official_id);
CREATE INDEX idx_sittings_organe_ref ON sittings(organe_ref);

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

-- Table: scrutins
-- Roll-call votes (scrutins) from Assemblée nationale open data
CREATE TABLE scrutins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id TEXT UNIQUE NOT NULL,
    sitting_id UUID REFERENCES sittings(id) ON DELETE SET NULL,
    date_scrutin DATE NOT NULL,
    numero TEXT NOT NULL,
    type_vote_code TEXT,
    type_vote_libelle TEXT,
    sort_code TEXT NOT NULL,
    sort_libelle TEXT,
    titre TEXT NOT NULL,
    synthese_pour INTEGER NOT NULL DEFAULT 0,
    synthese_contre INTEGER NOT NULL DEFAULT 0,
    synthese_abstentions INTEGER NOT NULL DEFAULT 0,
    synthese_non_votants INTEGER NOT NULL DEFAULT 0,
    official_url TEXT,
    objet_libelle TEXT,
    demandeur_texte TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrutins_date ON scrutins(date_scrutin);
CREATE INDEX idx_scrutins_official_id ON scrutins(official_id);
CREATE INDEX idx_scrutins_sitting_id ON scrutins(sitting_id);

CREATE TRIGGER update_scrutins_updated_at BEFORE UPDATE ON scrutins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: bills
-- Legislative texts (dossiers) linked to agenda items and scrutins
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,
    type TEXT,
    origin TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_official_id ON bills(official_id);

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: bill_scrutins
-- Link table between bills and scrutins (one bill can have many scrutins)
CREATE TABLE bill_scrutins (
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (bill_id, scrutin_id)
);

CREATE INDEX idx_bill_scrutins_scrutin_id ON bill_scrutins(scrutin_id);

-- Table: scrutin_votes
-- Per-deputy vote position for each scrutin (for deputy voting record)
CREATE TABLE scrutin_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    acteur_ref TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('pour', 'contre', 'abstention', 'non_votant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scrutin_id, acteur_ref)
);

CREATE INDEX idx_scrutin_votes_scrutin_id ON scrutin_votes(scrutin_id);
CREATE INDEX idx_scrutin_votes_acteur_ref ON scrutin_votes(acteur_ref);

-- Table: circonscriptions
-- Electoral constituencies (single source of truth); id = official ref (e.g. "7505", "1801")
-- geometry = GeoJSON geometry (Polygon/MultiPolygon) for map overlay (data.gouv.fr contours)
CREATE TABLE circonscriptions (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    geometry JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_circonscriptions_updated_at BEFORE UPDATE ON circonscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: deputies
-- Deputy (député) profiles from Assemblée nationale acteurs data
CREATE TABLE deputies (
    acteur_ref TEXT PRIMARY KEY,
    civil_nom TEXT NOT NULL,
    civil_prenom TEXT NOT NULL,
    date_naissance DATE,
    lieu_naissance TEXT,
    profession TEXT,
    sexe TEXT,
    parti_politique TEXT,
    groupe_politique TEXT,
    circonscription TEXT,
    ref_circonscription TEXT,
    departement TEXT,
    date_debut_mandat DATE,
    date_fin_mandat DATE,
    legislature INTEGER,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputies_groupe ON deputies(groupe_politique);
CREATE INDEX idx_deputies_departement ON deputies(departement);
CREATE INDEX idx_deputies_ref_circonscription ON deputies(ref_circonscription);
ALTER TABLE deputies ADD CONSTRAINT fk_deputies_ref_circonscription
    FOREIGN KEY (ref_circonscription) REFERENCES circonscriptions(id) ON DELETE SET NULL;

CREATE TRIGGER update_deputies_updated_at BEFORE UPDATE ON deputies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: political_groups_metadata
-- Optional metadata for political groups (dates, position, orientation, president)
-- Keyed by slug (slugified group label). Source: data.gouv.fr / Assemblée open data.
CREATE TABLE political_groups_metadata (
    slug TEXT PRIMARY KEY,
    date_debut DATE,
    date_fin DATE,
    position_politique TEXT CHECK (position_politique IN ('majoritaire', 'opposition', 'minoritaire')),
    orientation TEXT CHECK (orientation IN ('gauche', 'centre', 'droite')),
    couleur_hex TEXT,
    president_name TEXT,
    legislature INTEGER,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_political_groups_metadata_updated_at
    BEFORE UPDATE ON political_groups_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: push_tokens
-- Expo push tokens for mobile notifications (new scrutins, optional "my deputy" voted)
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expo_push_token TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL DEFAULT 'all' CHECK (topic IN ('all', 'my_deputy')),
    deputy_acteur_ref TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_topic_deputy ON push_tokens(topic, deputy_acteur_ref);

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: deputy_organes
-- Deputy membership in organes (commissions, etc.). Source: AMO mandats.
CREATE TABLE deputy_organes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acteur_ref TEXT NOT NULL REFERENCES deputies(acteur_ref) ON DELETE CASCADE,
    organe_ref TEXT NOT NULL REFERENCES organes(id) ON DELETE CASCADE,
    role TEXT,
    date_debut DATE,
    date_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(acteur_ref, organe_ref)
);

CREATE INDEX idx_deputy_organes_acteur_ref ON deputy_organes(acteur_ref);
CREATE INDEX idx_deputy_organes_organe_ref ON deputy_organes(organe_ref);

CREATE TRIGGER update_deputy_organes_updated_at BEFORE UPDATE ON deputy_organes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
