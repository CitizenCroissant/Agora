-- Organes (commissions, délégations, etc.) and sittings.organe_ref for commission reunions.
-- deputy_organes for deputy membership in commissions (used in step 5).
-- Requires: update_updated_at_column() from schema.sql.

-- Table: organes
-- Parliamentary organs: permanent commissions, special commissions, delegations, etc.
-- Source: AMO (acteurs/mandats/organes) open data.
CREATE TABLE IF NOT EXISTS organes (
    id TEXT PRIMARY KEY,
    libelle TEXT,
    libelle_abrege TEXT,
    type_organe TEXT NOT NULL,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organes_type_organe ON organes(type_organe);

DROP TRIGGER IF EXISTS update_organes_updated_at ON organes;
CREATE TRIGGER update_organes_updated_at BEFORE UPDATE ON organes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add organe_ref to sittings (for commission reunions; null for public sittings)
ALTER TABLE sittings ADD COLUMN IF NOT EXISTS organe_ref TEXT REFERENCES organes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sittings_organe_ref ON sittings(organe_ref);

-- Table: deputy_organes
-- Deputy membership in organes (commissions, etc.). Source: AMO mandats.
CREATE TABLE IF NOT EXISTS deputy_organes (
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

CREATE INDEX IF NOT EXISTS idx_deputy_organes_acteur_ref ON deputy_organes(acteur_ref);
CREATE INDEX IF NOT EXISTS idx_deputy_organes_organe_ref ON deputy_organes(organe_ref);

DROP TRIGGER IF EXISTS update_deputy_organes_updated_at ON deputy_organes;
CREATE TRIGGER update_deputy_organes_updated_at BEFORE UPDATE ON deputy_organes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
