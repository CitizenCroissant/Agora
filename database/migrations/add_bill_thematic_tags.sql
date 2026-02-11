-- Migration: Add thematic tags for bills
-- Creates a many-to-many relationship between bills and thematic_tags (reuses existing thematic_tags table)

CREATE TABLE IF NOT EXISTS bill_thematic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES thematic_tags(id) ON DELETE CASCADE,
    confidence REAL DEFAULT 0.5, -- 0.0-1.0 for auto-tagged items
    source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual', 'curated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_bill_tags_bill_id ON bill_thematic_tags(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_tags_tag_id ON bill_thematic_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_bill_tags_source ON bill_thematic_tags(source);
