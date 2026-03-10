-- Link amendments to bill_texts (textes) instead of bills (dossiers).
-- One bill (dossier) has many bill_texts (textes); each amendment belongs to one texte.
-- See docs/DOSSIER_VS_TEXTE.md.

-- 1) Create bill_texts table (one row per "texte" / document version per dossier)
CREATE TABLE IF NOT EXISTS bill_texts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
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

-- 2) One default texte per bill (texte_ref = bill.official_id) for existing data
INSERT INTO bill_texts (bill_id, texte_ref)
SELECT id, official_id FROM bills
ON CONFLICT (bill_id, texte_ref) DO NOTHING;

-- 3) Add bill_text_id to amendments and backfill
ALTER TABLE amendments ADD COLUMN IF NOT EXISTS bill_text_id UUID REFERENCES bill_texts(id) ON DELETE CASCADE;

UPDATE amendments a
SET bill_text_id = bt.id
FROM bill_texts bt
WHERE bt.bill_id = a.bill_id AND bt.texte_ref = (SELECT b.official_id FROM bills b WHERE b.id = a.bill_id);

-- Remove any amendments that did not match a bill_text (orphans)
DELETE FROM amendments WHERE bill_text_id IS NULL;

-- 4) Enforce NOT NULL and drop bill_id
ALTER TABLE amendments ALTER COLUMN bill_text_id SET NOT NULL;

ALTER TABLE amendments DROP CONSTRAINT IF EXISTS amendments_bill_id_numero_key;
ALTER TABLE amendments DROP CONSTRAINT IF EXISTS amendments_bill_id_official_id_key;

ALTER TABLE amendments DROP COLUMN bill_id;

ALTER TABLE amendments ADD CONSTRAINT amendments_bill_text_id_numero_key UNIQUE (bill_text_id, numero);

-- 5) Indexes
DROP INDEX IF EXISTS idx_amendments_bill_id;
DROP INDEX IF EXISTS idx_amendments_bill_numero;
DROP INDEX IF EXISTS idx_amendments_bill_numero_sort;

CREATE INDEX idx_amendments_bill_text_id ON amendments(bill_text_id);
CREATE INDEX idx_amendments_bill_text_numero ON amendments(bill_text_id, numero);
CREATE INDEX idx_amendments_bill_text_numero_sort ON amendments(bill_text_id, numero_sort NULLS LAST, numero);

COMMENT ON TABLE bill_texts IS 'One row per "texte" (document version) of a bill; amendments are attached to a texte, not directly to the bill.';
COMMENT ON COLUMN amendments.bill_text_id IS 'The texte (bill_text) this amendment is deposited on.';
