-- Replace bills table with a view over dossiers_legislatifs.
-- Run after add_dossiers_legislatifs_mirror.sql.
-- Migrates existing bills into dossiers_legislatifs and repoints FKs.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
        -- Migrate rows: use existing bills.id so bill_texts/bill_scrutins keep same bill_id
        INSERT INTO dossiers_legislatifs (id, uid, titre, procedure_libelle, amends_dossier_id, created_at, updated_at)
        SELECT b.id, b.official_id, b.title,
               COALESCE(b.type, b.origin),
               b.amends_bill_id,
               b.created_at, b.updated_at
        FROM bills b
        ON CONFLICT (uid) DO UPDATE SET
            titre = EXCLUDED.titre,
            procedure_libelle = EXCLUDED.procedure_libelle,
            amends_dossier_id = EXCLUDED.amends_dossier_id,
            updated_at = EXCLUDED.updated_at;

        -- Repoint bill_texts: already references bills(id); we keep same id in dossiers_legislatifs
        ALTER TABLE bill_texts DROP CONSTRAINT IF EXISTS bill_texts_bill_id_fkey;
        ALTER TABLE bill_texts ADD CONSTRAINT bill_texts_bill_id_fkey
            FOREIGN KEY (bill_id) REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE;

        -- Repoint bill_scrutins
        ALTER TABLE bill_scrutins DROP CONSTRAINT IF EXISTS bill_scrutins_bill_id_fkey;
        ALTER TABLE bill_scrutins ADD CONSTRAINT bill_scrutins_bill_id_fkey
            FOREIGN KEY (bill_id) REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE;

        -- Repoint bill_thematic_tags if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bill_thematic_tags') THEN
            ALTER TABLE bill_thematic_tags DROP CONSTRAINT IF EXISTS bill_thematic_tags_bill_id_fkey;
            ALTER TABLE bill_thematic_tags ADD CONSTRAINT bill_thematic_tags_bill_id_fkey
                FOREIGN KEY (bill_id) REFERENCES dossiers_legislatifs(id) ON DELETE CASCADE;
        END IF;

        DROP TABLE bills;
    END IF;
END $$;

-- View: app-facing "bills" with computed type, origin, short_title, official_url
CREATE OR REPLACE VIEW bills AS
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

COMMENT ON VIEW bills IS 'App-facing view over dossiers_legislatifs; type/origin/official_url/short_title are derived.';
