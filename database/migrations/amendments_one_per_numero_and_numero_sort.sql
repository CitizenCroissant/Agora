-- One amendment row per (bill_id, numero) and numeric sort for ordering.
-- 1) Add numero_sort for ORDER BY in list API.
-- 2) Merge duplicate (bill_id, numero) rows, then enforce UNIQUE(bill_id, numero).

-- Add column for numeric sort (leading digits of numero)
ALTER TABLE amendments
  ADD COLUMN IF NOT EXISTS numero_sort integer;

-- Backfill: set numero_sort from leading digits of numero
UPDATE amendments
SET numero_sort = (regexp_match(numero, '^[0-9]+'))[1]::integer
WHERE numero ~ '^[0-9]+';

-- Merge duplicate (bill_id, numero): keep min(id), reassign scrutin_amendments, delete duplicates
DO $$
DECLARE
  r RECORD;
  keep_id uuid;
  dup_ids uuid[];
BEGIN
  FOR r IN
    SELECT bill_id, numero,
           array_agg(id ORDER BY id) AS ids,
           count(*) AS cnt
    FROM amendments
    GROUP BY bill_id, numero
    HAVING count(*) > 1
  LOOP
    keep_id := r.ids[1];
    dup_ids := r.ids[2:array_length(r.ids, 1)];

    -- Point scrutin_amendments from duplicate rows to keep_id (skip if already exists)
    INSERT INTO scrutin_amendments (scrutin_id, amendment_id)
    SELECT scrutin_id, keep_id
    FROM scrutin_amendments
    WHERE amendment_id = ANY(dup_ids)
    ON CONFLICT (scrutin_id, amendment_id) DO NOTHING;

    DELETE FROM scrutin_amendments WHERE amendment_id = ANY(dup_ids);
    DELETE FROM amendments WHERE id = ANY(dup_ids);
  END LOOP;
END $$;

-- Drop old unique constraint (bill_id, official_id) and add (bill_id, numero)
ALTER TABLE amendments
  DROP CONSTRAINT IF EXISTS amendments_bill_id_official_id_key;

ALTER TABLE amendments
  ADD CONSTRAINT amendments_bill_id_numero_key UNIQUE (bill_id, numero);

-- Index for list API: list by bill_id ordered by numero_sort, numero
CREATE INDEX IF NOT EXISTS idx_amendments_bill_numero_sort
  ON amendments (bill_id, numero_sort NULLS LAST, numero);

COMMENT ON COLUMN amendments.numero_sort IS 'Leading digits of numero for numeric ordering in list API.';
