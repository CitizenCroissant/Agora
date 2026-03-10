# Amendments entity and scrutins ↔ amendments linking

We currently have **bills** (from dossiers) and **scrutins** (votes), with **scrutin → bill** linking by title matching. We do **not** ingest amendments. This doc outlines options for adding an amendment entity and linking scrutins to amendments.

## Current state

- **Bills**: From `Dossiers_Legislatifs.json.zip` (one JSON per dossier). Stored in `bills` with `official_id` = dossier `uid` (e.g. `DLR5L17N53329`).
- **Scrutins**: From `Scrutins.json.zip`. No dossier or amendment IDs in the data (fields null). We link scrutins to bills via:
  1. Explicit refs (never present)
  2. Title matching on `objet.libelle` / `titre` vs bill title
- **Amendments**: Not ingested. Official link is **dossier-centric**: one CSV per dossier listing amendments of that dossier ([FAQ](https://data.assemblee-nationale.fr/foire-aux-questions)); amendment XML/JSON also exists per amendment.

## Options for an amendment entity

### Option A: Full amendment entity, ingested with (or right after) dossier ingestion

- **What**: New table `amendments` (e.g. `id`, `bill_id`, `official_id`, `numero`, `objet`, `sort` adopté/rejeté, `official_url`, timestamps). Ingest amendments when we ingest dossiers (or in a separate step that runs after dossiers).
- **Source**: Official “liste des amendements d’un dossier législatif” = **one CSV per dossier** ([detail](https://data.assemblee-nationale.fr/dossierLeg/liste-amendements)). CSV lists amendments of that dossier; each row typically has an amendment identifier and often a URL to the amendment XML/JSON. We may need to resolve dossier `uid` (our `bills.official_id`) to the numeric or path used in the CSV URL (e.g. `.../dossiers_legislatifs_opendata/{dossierId}/libre_office.csv`); the portal “Choisir un dossier” may use a different key — needs a quick discovery step.
- **Pros**: Rich amendment data (authors, sort, objet); bill pages can show “X amendements”; we can link scrutins to specific amendments (see below).
- **Cons**: More storage and sync; N dossier CSVs + optionally N amendment files; need to handle CSV format and URL scheme per legislature.

### Option B: Lightweight “amendment list” per bill (no full amendment rows)

- **What**: Either (1) a JSON/array column on `bills` (e.g. `amendment_refs: string[]` or `amendment_count: int`), or (2) a minimal table `bill_amendments` with only `bill_id` + `numero` (and maybe `official_id`) for matching. We fetch only the **CSV per dossier** to get amendment numbers (and optionally refs), not the full amendment XML/JSON.
- **Pros**: Less storage; no per-amendment document fetch; still allows “this bill has these amendment numbers” and parsing “amendement n° 123” from scrutin text to link to (bill, 123).
- **Cons**: No amendment objet/sort/authors in our DB; we can’t show amendment text or sort on bill/amendment pages without fetching from official URLs on demand.

### Option C: No amendment entity (status quo)

- **What**: Keep only scrutins and bills; continue linking scrutins → bills by title matching. Optionally improve UX by showing “Vote sur un amendement” when `titre`/`objet` contain “amendement”, without storing which amendment.
- **Pros**: No new schema or ingestion. Cons: No “this vote was on amendment #X” or “amendments of this bill”.

**Recommendation for a first step**: **Option B** (lightweight) is a good middle ground: ingest the **per-dossier amendment list** (CSV) during or right after dossier ingestion, store either minimal rows (`bill_id`, `numero`, optional `official_id`) or a compact structure on the bill. That gives us amendment numbers per bill so we can link scrutins to amendments by number (see below) without yet maintaining full amendment content.

---

## Options for linking scrutins to amendments

The Scrutins open data does **not** provide amendment or dossier IDs. So any scrutin → amendment link is **heuristic**.

### 1. Parse amendment number(s) from scrutin text

- **Idea**: Many amendment scrutins contain “amendement n° 123”, “amendements n° 10, 11 et 12”, “amendement n° 456 (rect.)”. We parse numbers from `titre` and `objet.libelle`, then match to amendments we know belong to a bill.
- **Flow**: (1) We already link scrutin → bill (title matching). (2) From scrutin text, extract one or more amendment numbers. (3) Look up amendments for that bill with that `numero` (and legislature/session if needed). (4) Create `scrutin_amendments` (scrutin_id, amendment_id) or store “primary” amendment on the scrutin.
- **Pros**: Uses official amendment list (we know which numbers exist per bill); works for single- and multi-amendment votes if we define rules (e.g. “first number” = main amendment). Cons: Parsing is brittle (formats vary); one scrutin can cover several amendments; “n° 123” might be sub-amendment or lecture-specific — we need to align with how the CSV/XML identifies amendments (e.g. by a global ref vs dossier + number).

### 2. Scrutin → bill only; show “amendement” as label (no amendment entity)

- **Idea**: Keep only scrutin → bill. When `titre`/`objet` contain “amendement”, show “Vote sur un amendement” (or “Sur les amendements”) in the UI without storing which amendment(s).
- **Pros**: No new tables or parsing. Cons: No “this vote was on amendment #X” or link to amendment detail.

### 3. Text similarity (amendment objet vs scrutin libelle)

- **Idea**: For each amendment-scrutin pair (same bill), compare amendment `objet` to scrutin `objet.libelle` (e.g. embedding or substring). Link when similarity is high.
- **Pros**: Could handle cases where the number is missing or wrong. Cons: Expensive; many false positives/negatives; amendment text might be long and not match scrutin wording.

**Recommendation**: Implement **1 (parse amendment numbers)** once we have a minimal amendment list (Option B). Keep **2** as fallback (scrutin → bill + “amendement” label when no amendment match). Skip **3** unless we have a clear need and capacity.

---

## Implementation outline (if we choose Option B + number-based linking)

1. **Discover CSV format and URL**
   - For legislature 17, confirm URL pattern for “liste des amendements” (by dossier uid or other id). Fetch one sample CSV and document columns (amendment ref, numero, URL to XML/JSON, etc.).

2. **Schema**
   - Add table `amendments` with at least: `id`, `bill_id` (FK), `official_id` (unique ref from CSV/XML), `numero` (display number), optional `sort`, `official_url`. Or minimal `bill_amendments(bill_id, numero, official_id)` if we don’t need a full entity yet.
   - Add `scrutin_amendments(scrutin_id, amendment_id)` (or `scrutin_id`, `amendment_id` as primary link). Optionally a “primary” amendment on `scrutins` for display.

3. **Ingestion**
   - **During or after dossier ingestion**: For each dossier we upsert as a bill, fetch the dossier’s amendment list (CSV). Parse and upsert `amendments` (or `bill_amendments`) for that bill. If the CSV URL requires a different key than dossier `uid`, add a mapping (e.g. from dossier JSON or from a static list).
   - **Scrutins**: After scrutins (and bill_scrutins) are in place, run a **linking pass**: for each scrutin that (a) is linked to a bill and (b) has “amendement” in titre/objet, parse amendment numbers; for each number, resolve amendment by (bill_id, numero); insert `scrutin_amendments`. This can be part of `ingest-scrutins` or a separate job.

4. **Parsing amendment numbers**
   - Regex(es) on `titre` and `objet.libelle` for patterns like “amendement n° 123”, “amendements n° 10, 11, 12”, “n° 456 (rect.)”. Prefer the first number or the set; define rules for multi-amendment scrutins (e.g. link to all, or only the first). Validate that the number exists in `amendments` for the linked bill.

5. **API / UI**
   - Bill detail: list amendments (numero, sort, link to official URL). Scrutin detail: show “Amendement n° X” with link to amendment (and bill). Amendment detail page optional later.

---

## Summary

| Choice | Amendment entity | Scrutin → amendment link |
|--------|------------------|---------------------------|
| **A** | Full `amendments` table, ingest from CSV + optional XML/JSON per amendment | Parse amendment numbers from scrutin text; match to amendments by (bill, numero). |
| **B** | Minimal (amendment list per bill: numbers + refs, or small table) | Same: parse numbers, match to (bill_id, numero). |
| **C** | None | Keep only scrutin → bill; optional “Vote sur un amendement” label. |

Recommended path: **Option B** (lightweight amendment list) + **number-based scrutin → amendment linking**, with a small discovery task to confirm the per-dossier CSV URL and column format for our dossier `uid`.
