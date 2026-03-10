-- Dossier législatif mirror: store original open data in relational form.
-- bills becomes a view over this; FKs (bill_texts, bill_scrutins, etc.) point to dossiers_legislatifs(id).

-- 1) Mirror table: one row per dossier (source: Dossiers_Legislatifs.json.zip)
CREATE TABLE IF NOT EXISTS dossiers_legislatifs (
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

COMMENT ON TABLE dossiers_legislatifs IS 'Mirror of Assemblée nationale Dossiers_Legislatifs open data; one row per dossier. bills view is derived from this.';

-- 2) Initiateurs: acteurs/mandats that initiated the dossier (from initiateur.acteurs.acteur)
CREATE TABLE IF NOT EXISTS dossiers_initiateurs (
    dossier_id UUID NOT NULL REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE,
    ordre INT NOT NULL DEFAULT 0,
    acteur_ref TEXT,
    mandat_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (dossier_id, ordre)
);

CREATE INDEX idx_dossiers_initiateurs_dossier ON dossiers_initiateurs(dossier_id);
CREATE INDEX idx_dossiers_initiateurs_acteur ON dossiers_initiateurs(acteur_ref);

-- 3) Actes législatifs: tree of legislative acts (étapes, dépôts, discussions, etc.)
CREATE TABLE IF NOT EXISTS actes_legislatifs (
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

COMMENT ON TABLE actes_legislatifs IS 'Mirror of actesLegislatifs tree from dossier JSON; recursive (parent_id).';
