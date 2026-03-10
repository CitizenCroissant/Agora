# Dossier législatif – structure of the original JSON export

This document describes the **original** JSON structure of the Assemblée nationale **Dossiers législatifs** open data export, as published in `Dossiers_Legislatifs.json.zip`. It is not limited to what Agora currently extracts.

**Source**:  
`https://data.assemblee-nationale.fr/static/openData/repository/{leg}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`  
(Legislatures 14/15: `Dossiers_Legislatifs_XIV.json.zip`, `_XV.json.zip`)

**Format**: ZIP containing one JSON file per dossier. Each file path is under `json/dossierParlementaire/`.  
**Wrapper**: Each file is a single object with one top-level key: `dossierParlementaire`.

---

## 1. File wrapper

| Key                 | Type   | Description |
|---------------------|--------|-------------|
| `dossierParlementaire` | object | The single root entity (see below). |

---

## 2. `dossierParlementaire` – top-level keys

Keys observed in the export (union over legislature 17). Optional fields may be `null` or absent depending on dossier type.

| Key                     | Type    | Description |
|-------------------------|---------|-------------|
| `@xmlns`                | string  | XML namespace, e.g. `http://schemas.assemblee-nationale.fr/referentiel`. |
| `@xmlns:xsi`            | string  | XML Schema instance namespace. |
| `@xsi:type`             | string  | Discriminator for dossier type, e.g. `DossierMissionControle_Type`, or generic dossier type. |
| `uid`                   | string  | **Unique identifier** of the dossier (e.g. `DLR5L17N52422`). Used as `bills.official_id` in Agora. |
| `legislature`           | string  | Legislature number (e.g. `"17"`). |
| `titreDossier`          | object  | Title and URL-related fields (see §3). |
| `procedureParlementaire`| object  | Procedure type (see §4). |
| `actesLegislatifs`      | object  | **Tree of legislative acts** (steps, deposits, discussions, etc.) – can be nested (see §5). |
| `initiateur`            | object? | **Initiator** of the bill (e.g. government / MPs). Often `null` for some dossier types. When present: `initiateur.acteurs.acteur` (array or single object) with `acteurRef`, `mandatRef`. |
| `fusionDossier`         | object? | Reference to another dossier when this one is merged. Often `null`. |
| `PLF`                   | *       | Present on some dossiers (e.g. budget bills – projet de loi de finances). Not present on all. |
| `indexation`            | *       | Present on some dossiers. Not present on all. |

---

## 3. `titreDossier`

| Key             | Type   | Description |
|-----------------|--------|-------------|
| `titre`         | string | **Full title** of the legislative initiative (e.g. "Les dépenses de soutien aux aéroports"). |
| `titreChemin`   | string?| **URL slug** for the Assemblée website (no accents, no spaces). Used to build the dossier URL: `https://www.assemblee-nationale.fr/dyn/{leg}/dossiers/{titreChemin}`. |
| `senatChemin`   | string?| URL slug for the Sénat side when the dossier exists there. Often `null`. |

---

## 4. `procedureParlementaire`

| Key      | Type   | Description |
|----------|--------|-------------|
| `code`   | string?| Procedure code (e.g. `"19"`). |
| `libelle`| string?| **Human-readable procedure type**, e.g. "Rapport d'information sans mission", "Projet de loi", "Proposition de loi". Agora uses this to infer bill type and origin. |

---

## 5. `actesLegislatifs`

Recursive structure representing the **lifecycle** of the dossier: steps, deposits, committee work, plenary discussions, etc.

- **Top level**: `actesLegislatifs.acteLegislatif` — either a **single object** or an **array** of acts.
- Each **acte** can contain a nested `actesLegislatifs` (same shape), so the tree can be several levels deep.

**Fields observed on an `acteLegislatif`:**

| Key              | Type   | Description |
|------------------|--------|-------------|
| `@xsi:type`      | string | Act type, e.g. `Etape_Type`, `DepotRapport_Type`, `DiscussionSeancePublique`, etc. |
| `uid`            | string | Unique id of the act (e.g. `L17-AN20-52422`, `L17-VD226967`). |
| `codeActe`       | string | Code (e.g. `AN20`, `AN20-RAPPORT`). |
| `libelleActe`    | object?| Labels: `nomCanonique`, `libelleCourt` (e.g. "Dépôt de rapport", "Travaux"). |
| `dateActe`       | string?| ISO date-time of the act (e.g. `2025-07-02T00:00:00.000+02:00`). Can be `null` for grouping acts. |
| `organeRef`      | string?| Reference to an organ (committee, etc.), e.g. `PO59048`, `PO838901`. |
| `actesLegislatifs`| object?| Nested acts (same structure). |
| `texteAssocie`   | string?| Reference to an associated text (e.g. `RINFANR5L17B1659`). |
| `texteAdopte`    | string?| Reference to adopted text when applicable. |

The official knowledge base defines many act types (Initiative, Dépôt de rapport, Discussion en commission, Discussion en séance publique, Promulgation, etc.); see [Schema Dossier Législatif – Actes](http://www.assemblee-nationale.fr/opendata/Schemas_Entites/Loi/Dossier_Legislatif/Actes_Legislatifs.html).

---

## 6. `initiateur` (when present)

For dossiers that carry initiator information (e.g. many “projet de loi” / “proposition de loi”):

| Path                        | Type  | Description |
|-----------------------------|-------|-------------|
| `initiateur.acteurs.acteur`| array or object | One or more actors. |
| `acteur.acteurRef`         | string | Actor reference (e.g. `PA796090`). |
| `acteur.mandatRef`         | string | Mandate reference (e.g. `PM840372`). |

---

## 7. Official schema references

- **Bloc Législatif**: [Schema du Dossier Législatif](http://www.assemblee-nationale.fr/opendata/Schemas_Entites/Loi/Schema_DossierLegislatif.html) (conceptual: dossier = container of “actes législatifs”; metadata: legislature, titre, procedure, senatChemin, classification, etc.).
- **Actes législatifs**: [Principe des Actes Législatifs](http://www.assemblee-nationale.fr/opendata/Schemas_Entites/Loi/Dossier_Legislatif/Actes_Legislatifs.html) and the list of [act types](http://www.assemblee-nationale.fr/opendata/Schemas_Entites/Loi/Schema_DossierLegislatif.html#actes-legislatifs) (Initiative, Etape, DepotRapport, DiscussionCommission, etc.).
- **Schemas ZIP**: [data.assemblee-nationale.fr – Schemas](https://data.assemblee-nationale.fr/static/openData/repository/SCHEMAS/Schemas.zip) (XML schemas).
- **Knowledge base index**: [Index_pub.html](http://www.assemblee-nationale.fr/opendata/Index_pub.html).

---

## 8. Legislature 14 specific format

For legislature **14**, the ZIP contains **one single JSON file** (not one file per dossier). Structure:

- `export.textesLegislatifs.document` — **array** (or single object) of documents.
- Each document has: `dossierRef`, `titres.titrePrincipal`, `titres.titrePrincipalCourt`, `denominationStructurelle`, `classification.type` (code/libelle), etc.  
- One dossier can appear in several documents; the ingestion code groups by `dossierRef` to obtain one dossier per bill.

---

## 9. What Agora uses today

From this export, Agora reads and stores:

- `uid` → `bills.official_id` (dossiers_legislatifs.uid)
- `legislature` → filtering / URL building
- `titreDossier.titre` → `bills.title` / `short_title`
- `titreDossier.titreChemin` → `bills.official_url`
- `procedureParlementaire.libelle` → inference of `bills.type` and `bills.origin`
- **actesLegislatifs** tree → `actes_legislatifs` (flattened, with parent_id)
- **initiateur** → `dossiers_initiateurs`
- **acte.texteAssocie / texteAdopte** → used to create `bill_texts` (one row per distinct texte ref: dossier uid + texte_associe, texte_adopte)

Other fields (fusionDossier, PLF, indexation, organeRef, etc.) are stored in the mirror tables where present but not yet exposed by the app.

---

---

## 10. Agora mirror (relational store)

Agora stores the dossier export in **relational mirror tables** (no raw JSON blob) so the data is queryable and trustworthy:

| Table | Content |
|-------|--------|
| **dossiers_legislatifs** | One row per dossier: uid, legislature, xsi_type, procedure_*, titre, titre_chemin, senat_chemin, fusion_dossier_uid, plf (JSONB), indexation (JSONB), amends_dossier_id. |
| **dossiers_initiateurs** | One row per initiateur actor: dossier_id, ordre, acteur_ref, mandat_ref. |
| **actes_legislatifs** | One row per acte in the tree: dossier_id, parent_id, parent_uid, ordre, uid, xsi_type, code_acte, libelle_*, date_acte, organe_ref, texte_associe, texte_adopte. |

The **bills** view is derived from `dossiers_legislatifs` (computed: short_title, type, origin, official_url). The app and existing FKs (bill_texts, bill_scrutins) use `dossiers_legislatifs.id`; the view exposes the same `id` so the API does not change.

Ingestion writes only to the mirror tables; the view always reflects current mirror data.

*Generated with reference to the live export (legislature 17) and the official schema documentation. Last updated: 2026-02.*
