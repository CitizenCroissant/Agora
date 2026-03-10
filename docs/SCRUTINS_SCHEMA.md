# Scrutins open data schema (summary)

Source: Assemblée nationale open data, `Scrutins.json.zip` per legislature  
(e.g. `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip`).

The archive contains **one JSON file per scrutin**. Each file is a wrapper object with a single `scrutin` object. Our TypeScript types are in `apps/ingestion/src/scrutins-types.ts`.

## Root

- **`scrutin`** – single scrutin object (see below).

## Scrutin object (main fields)

| Field | Type | Meaning |
|-------|------|--------|
| `uid` | string | Unique identifier. |
| `numero` | string | Scrutin number. |
| `organeRef` | string? | Chamber/organ reference. |
| `legislature` | string? | Legislature (e.g. `"17"`). |
| `sessionRef` | string? | Session reference. |
| `seanceRef` | string? | Sitting (séance) reference; we use this to link to `sittings.official_id`. |
| `dateScrutin` | string | Vote date. |
| `quantiemeJourSeance` | string? | Day number in sitting. |
| `typeVote` | object? | `codeTypeVote`, `libelleTypeVote` (e.g. "scrutin public ordinaire"), `typeMajorite`. |
| `sort` | object? | Outcome: `code`, `libelle` (e.g. adopté, rejeté). |
| `titre` | string? | Title. |
| `demandeur` | object? | Who requested the vote: `texte` (e.g. "Président du groupe X"), `referenceLegislative` (in practice **null** in the dataset). |
| `objet` | object? | What is voted on: `libelle` (full description), `dossierLegislatif`, `referenceLegislative` (in practice **null** in the dataset). |
| `syntheseVote` | object? | Aggregated counts: `nombreVotants`, `suffragesExprimes`, `nbrSuffragesRequis`, `annonce`, `decompte` (`nonVotants`, `pour`, `contre`, `abstentions`, `nonVotantsVolontaires`). |
| `ventilationVotes` | object? | Per-group breakdown: `organe` → `groupes` → `groupe[]` (see below). |
| `lieuVote` | string? | Place of vote. |

Note: In the current Scrutins ZIP, **`objet.dossierLegislatif`**, **`objet.referenceLegislative`** and **`demandeur.referenceLegislative`** are **always null**. Bill linking is done by title matching; see [SCRUTINS_BILL_LINKING.md](./SCRUTINS_BILL_LINKING.md).

## Group vote (`ventilationVotes.organe.groupes.groupe`)

| Field | Meaning |
|-------|---------|
| `organeRef` | Political group organ reference. |
| `nombreMembresGroupe` | Number of members in the group. |
| `vote.positionMajoritaire` | Majority position (pour/contre/abstention/…). |
| `vote.decompteVoix` | Counts by position. |
| `vote.decompteNominatif` | Per-deputy: `nonVotants`, `pours`, `contres`, `abstentions` each with `votant` (or `votant[]`). |

## Votant (per-deputy in `decompteNominatif`)

| Field | Meaning |
|-------|---------|
| `acteurRef` | Deputy (acteur) reference. |
| `mandatRef` | Mandate reference. |
| `parDelegation` | If vote by delegation. |
| `numPlace` | Seat number. |
| `causePositionVote` | Reason for position (optional). |

---

There is no single official PDF “scrutins schema” document; the structure above is derived from the JSON files and our ingestion types. For the broader legislative data model and identifiers, see [OPEN_DATA_SOURCES.md](./OPEN_DATA_SOURCES.md) (official schemas and knowledge base links).
