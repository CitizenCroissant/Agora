-- Table: digest_subscriptions
-- Email subscriptions for "My deputy this week" weekly digest.
-- Subscriber identifies by département (Mon député flow) or by acteur_ref (direct deputy).
-- At least one of departement or acteur_ref must be set.
CREATE TABLE IF NOT EXISTS digest_subscriptions (
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

COMMENT ON TABLE digest_subscriptions IS 'Email subscriptions for weekly "Mon député" digest (votes this week).';
