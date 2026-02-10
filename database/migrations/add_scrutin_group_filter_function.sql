-- Migration: Add RPC to get scrutin IDs filtered by political group (and optional majority position)
-- Used by GET /api/scrutins?group=slug&group_position=pour|contre|abstention

CREATE OR REPLACE FUNCTION get_scrutin_ids_by_group(
  p_from DATE,
  p_to DATE,
  p_groupe_politique TEXT,
  p_position TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_position IS NULL THEN
    -- Scrutins in range where at least one deputy of this group voted
    RETURN QUERY
    SELECT DISTINCT s.id
    FROM scrutins s
    WHERE s.date_scrutin >= p_from AND s.date_scrutin <= p_to
      AND EXISTS (
        SELECT 1
        FROM scrutin_votes v
        JOIN deputies d ON d.acteur_ref = v.acteur_ref
        WHERE v.scrutin_id = s.id
          AND d.groupe_politique = p_groupe_politique
      );
  ELSE
    -- Scrutins in range where the group's majority position equals p_position
    RETURN QUERY
    WITH scrutins_in_range AS (
      SELECT s.id
      FROM scrutins s
      WHERE s.date_scrutin >= p_from AND s.date_scrutin <= p_to
    ),
    group_votes AS (
      SELECT v.scrutin_id, v.position, COUNT(*) AS cnt
      FROM scrutin_votes v
      JOIN deputies d ON d.acteur_ref = v.acteur_ref
      WHERE d.groupe_politique = p_groupe_politique
        AND v.scrutin_id IN (SELECT scrutins_in_range.id FROM scrutins_in_range)
      GROUP BY v.scrutin_id, v.position
    ),
    majority AS (
      SELECT gv.scrutin_id, gv.position,
        ROW_NUMBER() OVER (PARTITION BY gv.scrutin_id ORDER BY gv.cnt DESC) AS rn
      FROM group_votes gv
    )
    SELECT m.scrutin_id AS id
    FROM majority m
    WHERE m.rn = 1 AND m.position = p_position;
  END IF;
END;
$$;

-- Filter an arbitrary set of scrutin IDs by group (and optional majority position).
-- Used by GET /api/search?q=...&type=scrutins&group=slug&group_position=...
CREATE OR REPLACE FUNCTION filter_scrutin_ids_by_group(
  p_scrutin_ids UUID[],
  p_groupe_politique TEXT,
  p_position TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF array_length(p_scrutin_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF p_position IS NULL THEN
    RETURN QUERY
    SELECT DISTINCT s.id
    FROM scrutins s
    WHERE s.id = ANY(p_scrutin_ids)
      AND EXISTS (
        SELECT 1
        FROM scrutin_votes v
        JOIN deputies d ON d.acteur_ref = v.acteur_ref
        WHERE v.scrutin_id = s.id
          AND d.groupe_politique = p_groupe_politique
      );
  ELSE
    RETURN QUERY
    WITH group_votes AS (
      SELECT v.scrutin_id, v.position, COUNT(*) AS cnt
      FROM scrutin_votes v
      JOIN deputies d ON d.acteur_ref = v.acteur_ref
      WHERE d.groupe_politique = p_groupe_politique
        AND v.scrutin_id = ANY(p_scrutin_ids)
      GROUP BY v.scrutin_id, v.position
    ),
    majority AS (
      SELECT gv.scrutin_id, gv.position,
        ROW_NUMBER() OVER (PARTITION BY gv.scrutin_id ORDER BY gv.cnt DESC) AS rn
      FROM group_votes gv
    )
    SELECT m.scrutin_id AS id
    FROM majority m
    WHERE m.rn = 1 AND m.position = p_position;
  END IF;
END;
$$;
