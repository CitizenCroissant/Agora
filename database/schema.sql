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

-- Table: dossiers_legislatifs (mirror of open data)
-- One row per dossier from Dossiers_Legislatifs.json.zip. bills view is derived from this.
-- See docs/DOSSIER_OPEN_DATA_JSON_STRUCTURE.md.
CREATE TABLE dossiers_legislatifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT UNIQUE NOT NULL,
    legislature TEXT,
    xsi_type TEXT,
    procedure_code TEXT,
    procedure_libelle TEXT,
    titre TEXT NOT NULL,
    titre_chemin TEXT,
    senat_chemin TEXT,
    fusion_dossier_uid TEXT,
    plf JSONB,
    indexation JSONB,
    amends_dossier_id UUID REFERENCES dossiers_legislatifs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dossiers_legislatifs_uid ON dossiers_legislatifs(uid);
CREATE INDEX idx_dossiers_legislatifs_legislature ON dossiers_legislatifs(legislature);
CREATE INDEX idx_dossiers_legislatifs_amends ON dossiers_legislatifs(amends_dossier_id);

CREATE TRIGGER update_dossiers_legislatifs_updated_at
    BEFORE UPDATE ON dossiers_legislatifs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: dossiers_initiateurs (initiateur.acteurs from dossier JSON)
CREATE TABLE dossiers_initiateurs (
    dossier_id UUID NOT NULL REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE,
    ordre INT NOT NULL DEFAULT 0,
    acteur_ref TEXT,
    mandat_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (dossier_id, ordre)
);

CREATE INDEX idx_dossiers_initiateurs_dossier ON dossiers_initiateurs(dossier_id);
CREATE INDEX idx_dossiers_initiateurs_acteur ON dossiers_initiateurs(acteur_ref);

-- Table: actes_legislatifs (actesLegislatifs tree from dossier JSON)
CREATE TABLE actes_legislatifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id UUID NOT NULL REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES actes_legislatifs(id) ON DELETE CASCADE,
    parent_uid TEXT,
    ordre INT NOT NULL DEFAULT 0,
    uid TEXT,
    xsi_type TEXT,
    code_acte TEXT,
    libelle_nom_canonique TEXT,
    libelle_court TEXT,
    date_acte TIMESTAMPTZ,
    organe_ref TEXT,
    texte_associe TEXT,
    texte_adopte TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actes_legislatifs_dossier ON actes_legislatifs(dossier_id);
CREATE INDEX idx_actes_legislatifs_parent ON actes_legislatifs(parent_id);
CREATE INDEX idx_actes_legislatifs_uid ON actes_legislatifs(uid);
CREATE INDEX idx_actes_legislatifs_date ON actes_legislatifs(date_acte);

CREATE TRIGGER update_actes_legislatifs_updated_at
    BEFORE UPDATE ON actes_legislatifs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: bills (app-facing; derived from dossiers_legislatifs)
CREATE VIEW bills AS
SELECT
    d.id,
    d.uid AS official_id,
    d.titre AS title,
    CASE WHEN length(d.titre) > 160 THEN left(d.titre, 157) || '…' ELSE d.titre END AS short_title,
    CASE
        WHEN d.procedure_libelle ILIKE '%projet de loi%' OR d.procedure_libelle = 'projet_de_loi' THEN 'projet_de_loi'
        WHEN d.procedure_libelle ILIKE '%proposition de loi%' OR d.procedure_libelle = 'proposition_de_loi' THEN 'proposition_de_loi'
        WHEN d.procedure_libelle ILIKE '%résolution%' THEN 'resolution'
        ELSE NULL
    END AS type,
    CASE
        WHEN d.procedure_libelle ILIKE '%projet de loi%' OR d.procedure_libelle = 'projet_de_loi' THEN 'gouvernement'
        WHEN d.procedure_libelle ILIKE '%proposition de loi%' OR d.procedure_libelle = 'proposition_de_loi' THEN 'parlementaire'
        ELSE NULL
    END AS origin,
    CASE WHEN d.titre_chemin IS NOT NULL AND d.legislature IS NOT NULL
        THEN 'https://www.assemblee-nationale.fr/dyn/' || d.legislature || '/dossiers/' || d.titre_chemin
        ELSE NULL
    END AS official_url,
    d.amends_dossier_id AS amends_bill_id,
    d.created_at,
    d.updated_at
FROM dossiers_legislatifs d;

-- Table: bill_scrutins
-- Link table between bills (dossiers) and scrutins
CREATE TABLE bill_scrutins (
    bill_id UUID NOT NULL REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE,
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (bill_id, scrutin_id)
);

CREATE INDEX idx_bill_scrutins_scrutin_id ON bill_scrutins(scrutin_id);

-- Table: bill_texts (textes – document versions of a bill)
-- One row per "texte" (e.g. texte initial, texte de la commission). Amendments link to a texte, not to the bill.
-- See docs/DOSSIER_VS_TEXTE.md.
CREATE TABLE bill_texts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE,
    texte_ref TEXT NOT NULL,
    numero TEXT,
    label TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_id, texte_ref)
);

CREATE INDEX idx_bill_texts_bill_id ON bill_texts(bill_id);

CREATE TRIGGER update_bill_texts_updated_at BEFORE UPDATE ON bill_texts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: amendments (lightweight list per texte; for scrutin→amendment linking)
-- One row per (bill_text_id, numero). Amendments belong to a texte (bill_text), not directly to the bill.
CREATE TABLE amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_text_id UUID NOT NULL REFERENCES bill_texts(id) ON DELETE CASCADE,
    official_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    official_url TEXT,
    numero_sort INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_text_id, numero)
);

CREATE INDEX idx_amendments_bill_text_id ON amendments(bill_text_id);
CREATE INDEX idx_amendments_bill_text_numero ON amendments(bill_text_id, numero);
CREATE INDEX idx_amendments_bill_text_numero_sort ON amendments(bill_text_id, numero_sort NULLS LAST, numero);

CREATE TRIGGER update_amendments_updated_at BEFORE UPDATE ON amendments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: scrutin_amendments (links scrutins to amendments when vote mentions amendment number)
CREATE TABLE scrutin_amendments (
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    amendment_id UUID NOT NULL REFERENCES amendments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (scrutin_id, amendment_id)
);

CREATE INDEX idx_scrutin_amendments_scrutin_id ON scrutin_amendments(scrutin_id);
CREATE INDEX idx_scrutin_amendments_amendment_id ON scrutin_amendments(amendment_id);

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

-- Table: digest_subscriptions
-- Email subscriptions for "My deputy this week" weekly digest (Mon député flow).
CREATE TABLE digest_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    departement TEXT NULL,
    acteur_ref TEXT NULL,
    unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT digest_sub_one_target CHECK (
        (departement IS NOT NULL AND acteur_ref IS NULL) OR
        (departement IS NULL AND acteur_ref IS NOT NULL)
    )
);

CREATE INDEX idx_digest_subscriptions_email ON digest_subscriptions(email);
CREATE INDEX idx_digest_subscriptions_unsubscribe_token ON digest_subscriptions(unsubscribe_token);
CREATE INDEX idx_digest_subscriptions_departement ON digest_subscriptions(departement) WHERE departement IS NOT NULL;
CREATE INDEX idx_digest_subscriptions_acteur_ref ON digest_subscriptions(acteur_ref) WHERE acteur_ref IS NOT NULL;

CREATE TRIGGER update_digest_subscriptions_updated_at
    BEFORE UPDATE ON digest_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: follows
-- "I'm following this": user (by device_id) subscribes to a deputy, bill, or group.
CREATE TABLE follows (
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

-- Table: sitting_attendance
-- Per-deputy presence for each sitting (commission reunions and, in future, séance publique if data becomes available)
CREATE TABLE sitting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sitting_id UUID NOT NULL REFERENCES sittings(id) ON DELETE CASCADE,
    acteur_ref TEXT NOT NULL REFERENCES deputies(acteur_ref) ON DELETE CASCADE,
    presence TEXT NOT NULL CHECK (presence IN ('présent', 'absent', 'excusé')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sitting_id, acteur_ref)
);

CREATE INDEX idx_sitting_attendance_sitting_id ON sitting_attendance(sitting_id);
CREATE INDEX idx_sitting_attendance_acteur_ref ON sitting_attendance(acteur_ref);

CREATE TRIGGER update_sitting_attendance_updated_at
    BEFORE UPDATE ON sitting_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: deputy_daily_attendance
-- Aggregated daily attendance and voting participation per deputy, for heatmaps and metrics.
CREATE VIEW deputy_daily_attendance AS
WITH sitting_days AS (
    SELECT
        sa.acteur_ref,
        s.date AS day,
        COUNT(*) FILTER (WHERE sa.presence IS NOT NULL) AS total_sittings,
        COUNT(*) FILTER (WHERE sa.presence = 'présent') AS attended_sittings,
        BOOL_OR(sa.presence = 'excusé') AS has_excused_absence
    FROM sitting_attendance sa
    JOIN sittings s ON s.id = sa.sitting_id
    GROUP BY sa.acteur_ref, s.date
), vote_days AS (
    SELECT
        sv.acteur_ref,
        sc.date_scrutin AS day,
        COUNT(*) AS total_votes,
        COUNT(*) FILTER (WHERE sv.position IN ('pour', 'contre', 'abstention')) AS participated_votes
    FROM scrutin_votes sv
    JOIN scrutins sc ON sc.id = sv.scrutin_id
    GROUP BY sv.acteur_ref, sc.date_scrutin
), all_days AS (
    SELECT acteur_ref, day FROM sitting_days
    UNION
    SELECT acteur_ref, day FROM vote_days
)
SELECT
    d.acteur_ref,
    d.day AS date,
    COALESCE(sd.total_sittings, 0) AS total_sittings,
    COALESCE(sd.attended_sittings, 0) AS attended_sittings,
    COALESCE(vd.total_votes, 0) AS total_votes,
    COALESCE(vd.participated_votes, 0) AS participated_votes,
    COALESCE(sd.has_excused_absence, FALSE) AS has_excused_absence,
    -- Parliament considered "open" when at least one sitting or vote exists that day
    (COALESCE(sd.total_sittings, 0) > 0 OR COALESCE(vd.total_votes, 0) > 0) AS parliament_open
FROM all_days d
LEFT JOIN sitting_days sd
    ON sd.acteur_ref = d.acteur_ref AND sd.day = d.day
LEFT JOIN vote_days vd
    ON vd.acteur_ref = d.acteur_ref AND vd.day = d.day;

