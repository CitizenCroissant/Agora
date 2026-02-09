-- Migration: Add thematic tags for scrutins filtering
-- Creates tables for thematic tags and many-to-many relationship with scrutins

-- Table: thematic_tags
-- Defines the thematic domains (rubriques thématiques) for classifying scrutins
CREATE TABLE IF NOT EXISTS thematic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- e.g., 'sante', 'economie'
    label TEXT NOT NULL, -- e.g., 'Santé et accès aux soins'
    description TEXT,
    color TEXT, -- Optional: for UI display (e.g., '#3B82F6')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thematic_tags_slug ON thematic_tags(slug);

-- Table: scrutin_thematic_tags
-- Many-to-many relationship between scrutins and thematic tags
CREATE TABLE IF NOT EXISTS scrutin_thematic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES thematic_tags(id) ON DELETE CASCADE,
    confidence REAL DEFAULT 0.5, -- 0.0-1.0 for auto-tagged items
    source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual', 'curated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scrutin_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_scrutin_tags_scrutin_id ON scrutin_thematic_tags(scrutin_id);
CREATE INDEX IF NOT EXISTS idx_scrutin_tags_tag_id ON scrutin_thematic_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_scrutin_tags_source ON scrutin_thematic_tags(source);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_thematic_tags_updated_at BEFORE UPDATE ON thematic_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data: Official Assemblée nationale thematic domains
INSERT INTO thematic_tags (slug, label, description, color) VALUES
    ('action-publique', 'Action publique, fonction publique et simplification', 'Administration publique, services publics, décentralisation', '#6366F1'),
    ('agriculture', 'Agriculture et souveraineté alimentaire', 'Agriculture, alimentation, ruralité', '#10B981'),
    ('amenagement', 'Aménagement du territoire et décentralisation', 'Territoire, collectivités locales, urbanisme', '#8B5CF6'),
    ('autonomie', 'Autonomie et handicap', 'Handicap, dépendance, accessibilité', '#EC4899'),
    ('commerce', 'Commerce, artisanat, PME', 'Petites et moyennes entreprises, commerce, artisanat', '#F59E0B'),
    ('culture', 'Culture', 'Patrimoine, arts, audiovisuel', '#EF4444'),
    ('economie', 'Économie, finances, souveraineté industrielle', 'Finances publiques, budget, fiscalité, industrie', '#3B82F6'),
    ('education', 'Éducation nationale et recherche', 'Enseignement, formation, recherche scientifique', '#06B6D4'),
    ('europe', 'Europe et affaires étrangères', 'Union européenne, relations internationales, diplomatie', '#0EA5E9'),
    ('interieur', 'Intérieur', 'Sécurité, police, gendarmerie, ordre public', '#64748B'),
    ('justice', 'Justice', 'Droit, tribunaux, système judiciaire', '#7C3AED'),
    ('logement', 'Logement', 'Habitat, logement social, construction', '#F97316'),
    ('sante', 'Santé et accès aux soins', 'Santé publique, hôpitaux, médecine', '#14B8A6'),
    ('environnement', 'Transition écologique, biodiversité', 'Environnement, climat, énergie, biodiversité', '#22C55E'),
    ('transport', 'Transports', 'Infrastructures, mobilité, routes, rail', '#84CC16'),
    ('travail', 'Travail et emploi', 'Emploi, chômage, formation professionnelle, retraite', '#EAB308')
ON CONFLICT (slug) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    updated_at = NOW();
