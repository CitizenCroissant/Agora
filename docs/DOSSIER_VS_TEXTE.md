# Dossier législatif vs Texte – Assemblée nationale

The Assemblée nationale site and open data distinguish two concepts that we should reflect in our data model and naming.

## 1. Dossier législatif (legislative dossier)

- **What it is**: The full legislative *dossier* for one bill initiative – the container for the entire lifecycle of a bill.
- **Example**: [Empêcher la constitution de monopoles économiques dans les secteurs des médias](https://www.assemblee-nationale.fr/dyn/17/dossiers/monopoles_economiques_medias_17e)
- **URL pattern**: `https://www.assemblee-nationale.fr/dyn/{leg}/dossiers/{slug}` (e.g. `dossiers/monopoles_economiques_medias_17e`)
- **Contains**: Deposit date, first reading, commission work, reports, **multiple textes** (see below), amendments **per texte** (e.g. “26 amendements sur le texte 2216”, “87 amendements sur le texte 2429”), and public-session discussion.

One dossier = one bill initiative (one “proposition de loi” or “projet de loi”) with a single title and a timeline of steps and documents.

## 2. Texte (legislative text / document version)

- **What it is**: A specific *version* of the bill text at a given stage – one document in the dossier’s timeline.
- **Example**: [Texte de la commission, n° 2429-A0](https://www.assemblee-nationale.fr/dyn/17/textes/l17b2429_texte-adopte-commission)
- **URL pattern**: `https://www.assemblee-nationale.fr/dyn/{leg}/textes/{texteRef}` (e.g. `textes/l17b2429_texte-adopte-commission`)
- **Examples of types**: Texte initial (e.g. n° 2216), Texte de la commission (n° 2429-A0), Texte adopté par l’Assemblée, etc.

One dossier has **many textes**; each texte has a number (2216, 2429-A0) and a type (initial, commission, adopté, …). Amendments are deposited “on” a given texte (e.g. 26 on initial text 2216, 87 on commission text 2429).

## Summary

| Concept            | French              | One per…        | Example URL path                          | Example identifier / number   |
|--------------------|---------------------|------------------|-------------------------------------------|-------------------------------|
| Dossier législatif | Dossier législatif  | Bill initiative  | `/dyn/17/dossiers/monopoles_economiques_medias_17e` | Dossier uid (e.g. DLR5L17N…)  |
| Texte              | Texte               | Document version | `/dyn/17/textes/l17b2429_texte-adopte-commission`   | Texte ref, numéro (2429-A0)   |

## Current Agora model

- **`bills`** table: One row per **dossier législatif**. `official_id` = dossier `uid` from open data (e.g. `DLR5L17N53735`).
- **`bill_texts`** table: One row per **texte** (document version) of a bill. `bill_id` → `bills`, `texte_ref` (e.g. AN ref or dossier ref). **Created by dossier ingestion** from the actes tree: dossier uid plus all distinct `texte_associe` and `texte_adopte` from actes législatifs.
- **Agenda items**: Can store `reference_code` / `official_url` from the agenda open data; that reference may point to a **texte** or dossier; the human-readable dossier page is under `/dossiers/`, while a specific document is under `/textes/`.
- **Amendments**: Stored per **texte** via `bill_text_id` (FK to `bill_texts`). When the open data provides `texteRef` we use it; otherwise we use one default texte per bill (`texte_ref` = bill’s `official_id`).
