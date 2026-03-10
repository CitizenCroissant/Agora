# Open data sources (Assemblée nationale)

Agora uses official open data from the French Assemblée nationale. This document lists each source, where official documentation exists, and how entities (amendments, bills, scrutins) are linked in the official data vs. in Agora.

## Official documentation (publisher)

| Resource | URL | Description |
|----------|-----|-------------|
| **Open data portal** | [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr) | Main entry: datasets (votes, scrutins, réunions, agendas, dossiers législatifs, députés, amendements, etc.) with short descriptions and download links. |
| **FAQ** | [data.assemblee-nationale.fr/foire-aux-questions](https://data.assemblee-nationale.fr/foire-aux-questions) | How to retrieve **amendements** (per legislature, per dossier, “fil de l’eau”), publication CSV, amendment XML/JSON/PDF; schema evolution (2020). **Does not document** scrutins, agendas, or dossiers record-by-record. |
| **Legislative data schemas** | [data.assemblee-nationale.fr/autres/schemas/donnees-legislatives](https://data.assemblee-nationale.fr/autres/schemas/donnees-legislatives) | Points to full documentation and XML schemas. |
| **Knowledge base (schemas, fluxes, glossary)** | [www.assemblee-nationale.fr/opendata/Index_pub.html](http://www.assemblee-nationale.fr/opendata/Index_pub.html) | Detailed docs: entity schemas (Bloc Législatif, AMO, etc.), identifiers, OpenData fluxes, glossary. |
| **Schemas ZIP** | [data.assemblee-nationale.fr/static/openData/repository/SCHEMAS/Schemas.zip](https://data.assemblee-nationale.fr/static/openData/repository/SCHEMAS/Schemas.zip) | XML schemas for legislative data. |
| **Licence** | [data.assemblee-nationale.fr/licence-ouverte-open-licence](https://data.assemblee-nationale.fr/licence-ouverte-open-licence) | Open licence (Licence Ouverte / Etalab). |
| **Contact** | [opendata@assemblee-nationale.fr](mailto:opendata@assemblee-nationale.fr) | Questions about open data. |

## Sources we use

### Agenda (réunions / sittings and agenda items)

| Field | Value |
|-------|--------|
| **URL** | `https://data.assemblee-nationale.fr/static/openData/repository/{leg}/vp/reunions/Agenda.json.zip` |
| **Legislatures** | 14, 15, 16, 17 (14/15: `Agenda_{XIV\|XV}.json.zip`) |
| **Format** | ZIP with one JSON file per reunion (or single JSON for leg 14). |
| **Official description** | [Réunions](https://data.assemblee-nationale.fr/reunions/reunions): séances publiques, réunions de commissions, etc.; date, lieu, ordre du jour. |
| **Our types** | `apps/ingestion/src/types.ts` (`AssembleeReunion`, `AssembleePointODJ`, etc.). |

### Scrutins (roll-call votes)

| Field | Value |
|-------|--------|
| **URL** | `https://data.assemblee-nationale.fr/static/openData/repository/{leg}/loi/scrutins/Scrutins.json.zip` |
| **Format** | ZIP with one JSON file per scrutin. |
| **Official description** | [Votes / Scrutins](https://data.assemblee-nationale.fr/archives-16e/votes): positions de vote par député (scrutins publics, etc.). |
| **Our types / schema** | `apps/ingestion/src/scrutins-types.ts`, [docs/SCRUTINS_SCHEMA.md](./SCRUTINS_SCHEMA.md). |
| **Linking to bills** | No dossier/amendment IDs in the Scrutins dataset; we use title matching. See [SCRUTINS_BILL_LINKING.md](./SCRUTINS_BILL_LINKING.md). |

### Dossiers législatifs (bills)

| Field | Value |
|-------|--------|
| **URL** | `https://data.assemblee-nationale.fr/static/openData/repository/{leg}/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip` (14/15: `Dossiers_Legislatifs_XIV.json.zip` / `_XV.json.zip`) |
| **Legislatures** | 14, 15, 16, 17. |
| **Format** | ZIP with one JSON file per dossier. |
| **Official description** | [Dossiers législatifs](https://data.assemblee-nationale.fr/travaux-parlementaires/dossiers-legislatifs): projets et propositions de loi, textes adoptés, rapports, comptes rendus. |

### Amendements (amendments)

We do **not** ingest amendements; the following is for reference and linking.

| Field | Value |
|-------|--------|
| **Full legislature** | Archive ZIP (XML/JSON) of all amendments. Example: `.../15/loi/amendements_legis/Amendements_XV.xml.zip`. Latency: 1 day. |
| **Per-dossier list** | One **CSV per dossier législatif** listing all amendments of that dossier. Latency: 1 hour. See [Official linking: amendments ↔ bills](#official-linking-amendments--bills) below. |
| **FAQ** | [Comment récupérer les amendements en Opendata ?](https://data.assemblee-nationale.fr/foire-aux-questions) (retrieval strategies, publication CSV, amendment XML/JSON/PDF). |

### Deputies (AMO acteurs / organes)

| Field | Value |
|-------|--------|
| **URL** | `https://data.assemblee-nationale.fr/static/openData/repository/{leg}/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip` |
| **Format** | ZIP with composite JSON (acteurs + organes). |
| **Official description** | [Députés en exercice](https://data.assemblee-nationale.fr/acteurs/deputes-en-exercice). Schema context: [Bloc AMO](http://www.assemblee-nationale.fr/opendata/Schemas_Entites/AMO_Bloc.html) in the knowledge base. |
| **Our types** | `apps/ingestion/src/deputies-types.ts`. |

### Circonscriptions

| Field | Value |
|-------|--------|
| **Source** | data.gouv.fr – Contours géographiques des circonscriptions législatives (GeoJSON). |
| **Note** | Not on data.assemblee-nationale.fr; deputies reference circonscriptions. |

---

## Official linking: amendments ↔ bills (dossiers)

From the [official FAQ](https://data.assemblee-nationale.fr/foire-aux-questions):

- **Bill → Amendments (official way)**  
  The publisher provides a **“liste des amendements d’un dossier législatif”**: one CSV (Excel/LibreOffice) **per dossier législatif** that lists all amendments of that dossier.  
  - Detail: [data.assemblee-nationale.fr/dossierLeg/liste-amendements](https://data.assemblee-nationale.fr/dossierLeg/liste-amendements)  
  - Example URL pattern: `.../repository/{leg}/dossiers_legislatifs_opendata/{dossierId}/libre_office.csv`  
  So the **canonical official link** is **dossier-centric**: for each bill (dossier), you get a resource that lists its amendments.

- **Amendment → Bill**  
  If you obtain amendments via that per-dossier CSV, each row is an amendment belonging to that dossier. The FAQ does not document the exact fields inside the amendment XML/JSON (e.g. whether each amendment carries a `dossierRef`); the [schemas / knowledge base](http://www.assemblee-nationale.fr/opendata/Index_pub.html) and [Schemas.zip](https://data.assemblee-nationale.fr/static/openData/repository/SCHEMAS/Schemas.zip) describe the legislative entity model.

- **Scrutins ↔ amendments / bills**  
  The FAQ **does not** describe scrutins or any link between scrutins and amendments/dossiers. The Scrutins open data (ZIP per legislature) does **not** provide dossier or amendment identifiers in practice (fields such as `objet.dossierLegislatif` / `referenceLegislative` are null). Agora therefore links scrutins to bills by **title matching** on the scrutin’s text and the bill title; see [SCRUTINS_BILL_LINKING.md](./SCRUTINS_BILL_LINKING.md).

---

## Summary

| Link | Official method | Agora |
|------|-----------------|--------|
| **Bill → Amendments** | One CSV per dossier listing amendments of that dossier (FAQ). | We do not ingest amendments. |
| **Amendment → Bill** | Implicit via per-dossier CSV; amendment record structure in schema docs. | — |
| **Scrutin → Bill** | Not documented; Scrutins dataset has no dossier/amendment IDs. | Title matching + API fallback (see SCRUTINS_BILL_LINKING.md). |
| **Scrutin → Amendment** | Not documented in FAQ. | We do not model amendments. For options (amendment entity + scrutin↔amendment linking), see [AMENDMENTS_AND_SCRUTINS_DESIGN.md](./AMENDMENTS_AND_SCRUTINS_DESIGN.md). |
