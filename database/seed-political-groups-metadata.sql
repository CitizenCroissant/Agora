-- Seed political groups metadata for 17e législature (2024–2029)
-- Slugs must match slugify(groupe_politique) from deputies (usually libelleAbrege: EPR, RN, SOC, etc.)
-- Data sources: Assemblée nationale, data.gouv.fr, public sources

INSERT INTO political_groups_metadata (slug, date_debut, position_politique, orientation, president_name, legislature, official_url) VALUES
('epr', '2024-07-18', 'majoritaire', 'centre', 'Gabriel Attal', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/ensemble-pour-la-republique'),
('rn', '2024-07-18', 'opposition', 'droite', 'Marine Le Pen', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/rassemblement-national'),
('soc', '2024-07-18', 'opposition', 'gauche', 'Boris Vallaud', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/socialistes-et-apparentes'),
('lfi', '2024-07-18', 'opposition', 'gauche', 'Mathilde Panot', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/la-france-insoumise-nouveau-front-populaire'),
('dr', '2024-07-18', 'opposition', 'droite', 'Laurent Wauquiez', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/droite-republicaine'),
('ecolo', '2024-07-18', 'opposition', 'gauche', 'Cyrielle Chatelain', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/ecologiste-et-social'),
('dem', '2024-07-18', 'majoritaire', 'centre', 'Marc Fesneau', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/les-democrates'),
('hor', '2024-07-18', 'majoritaire', 'droite', 'Laurent Marcangeli', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/horizons-et-independants'),
('liot', '2024-07-18', 'minoritaire', 'centre', 'Stéphane Lenormand', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/libertes-independants-outre-mer-et-territoires'),
('gdr', '2024-07-18', 'opposition', 'gauche', 'André Chassaigne', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/gauche-democratique-et-republicaine'),
('udr', '2024-07-18', 'opposition', 'droite', 'Éric Ciotti', 17, 'https://www.assemblee-nationale.fr/dyn/groupes/union-des-droites-pour-la-republique')
ON CONFLICT (slug) DO UPDATE SET
  date_debut = EXCLUDED.date_debut,
  position_politique = EXCLUDED.position_politique,
  orientation = EXCLUDED.orientation,
  president_name = EXCLUDED.president_name,
  legislature = EXCLUDED.legislature,
  official_url = EXCLUDED.official_url,
  updated_at = NOW();
