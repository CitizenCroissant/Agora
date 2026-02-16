-- Amendment bills: link to the main bill they amend.
-- When set, this bill is an amendment to the referenced bill (e.g. "Amendement n° X au projet de loi Y").
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS amends_bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bills_amends_bill_id ON bills(amends_bill_id);

COMMENT ON COLUMN bills.amends_bill_id IS 'When set, this bill is an amendment to the referenced bill (main text).';
