-- Fix organe official_url: the correct Assemblée nationale URL format is
-- https://www.assemblee-nationale.fr/dyn/org/{organeId}
-- (not /dyn/17/organes/{organeId} which returns 404).
UPDATE organes
SET official_url = 'https://www.assemblee-nationale.fr/dyn/org/' || id
WHERE official_url IS NULL OR official_url != 'https://www.assemblee-nationale.fr/dyn/org/' || id;
