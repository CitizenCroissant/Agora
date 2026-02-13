-- Add official plain-language context fields for scrutins (feature: plain-language context for votes).
-- objet_libelle: full official description of what is being voted on (from Assemblée open data).
-- demandeur_texte: who requested the vote (e.g. "Président du groupe X").
ALTER TABLE scrutins
  ADD COLUMN IF NOT EXISTS objet_libelle TEXT,
  ADD COLUMN IF NOT EXISTS demandeur_texte TEXT;
