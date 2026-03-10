-- Lightweight amendments (Option B): list per bill for scrutin linking.
-- Amendments are ingested from the legislature Amendements JSON ZIP; we store only
-- bill_id, official_id, numero (and optional official_url) for matching scrutins.

CREATE TABLE IF NOT EXISTS amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    official_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_id, official_id)
);

CREATE INDEX IF NOT EXISTS idx_amendments_bill_id ON amendments(bill_id);
CREATE INDEX IF NOT EXISTS idx_amendments_bill_numero ON amendments(bill_id, numero);
CREATE INDEX IF NOT EXISTS idx_amendments_official_id ON amendments(official_id);

CREATE TRIGGER update_amendments_updated_at BEFORE UPDATE ON amendments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link scrutins to amendments (e.g. "Vote sur l'amendement n° 123" -> amendment 123 of the bill).
CREATE TABLE IF NOT EXISTS scrutin_amendments (
    scrutin_id UUID NOT NULL REFERENCES scrutins(id) ON DELETE CASCADE,
    amendment_id UUID NOT NULL REFERENCES amendments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (scrutin_id, amendment_id)
);

CREATE INDEX IF NOT EXISTS idx_scrutin_amendments_scrutin_id ON scrutin_amendments(scrutin_id);
CREATE INDEX IF NOT EXISTS idx_scrutin_amendments_amendment_id ON scrutin_amendments(amendment_id);

COMMENT ON TABLE amendments IS 'Lightweight amendment list per bill (from Amendements.json.zip); used to link scrutins to specific amendments by number.';
COMMENT ON TABLE scrutin_amendments IS 'Links scrutins to amendments when scrutin text mentions amendment number(s) and we have that amendment for the linked bill.';
