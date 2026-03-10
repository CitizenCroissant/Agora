# Why many scrutins have no bill/dossier link

The ingestion script links each scrutin to a bill (dossier législatif) when possible. In practice, many scrutins end up with **no link**. Below is why and what was verified on the real data.

## Official documentation (FAQ): amendments and scrutins

The [official open data FAQ](https://data.assemblee-nationale.fr/foire-aux-questions) describes how to retrieve **amendements** and how they relate to **dossiers législatifs** (bills):

- **Official way to link amendments to bills**: The publisher provides a **“liste des amendements d’un dossier législatif”**: one CSV per **dossier législatif** (bill) that lists all amendments of that dossier. So the canonical link is **bill → amendments** (dossier-centric). Detail: [data.assemblee-nationale.fr/dossierLeg/liste-amendements](https://data.assemblee-nationale.fr/dossierLeg/liste-amendements). The FAQ does not document the reverse (amendment record fields pointing to a dossier); the amendment XML/JSON structure is described in the [legislative schemas / knowledge base](http://www.assemblee-nationale.fr/opendata/Index_pub.html).
- **Scrutins**: The FAQ **does not** describe the Scrutins dataset or any official link between scrutins and amendments or dossiers. The Scrutins open data files do not contain filled dossier or amendment identifiers (see below). So there is **no official “scrutin → bill” or “scrutin → amendment” link** in the published data; we use title matching for scrutins → bills.

See [OPEN_DATA_SOURCES.md](./OPEN_DATA_SOURCES.md) for a full list of official docs and linking summary.

## How linking works today

The script tries, in order:

1. **Explicit dossier ref**  
   From `objet.dossierLegislatif`, `objet.referenceLegislative`, `demandeur.referenceLegislative` (and PascalCase / alternate key variants). If present and a matching bill exists in `bills`, we create a `bill_scrutins` row.

2. **Fallback: title matching**  
   We normalize the scrutin's `objet.libelle` (or `titre`) and each bill's title; for amendment-like text we also extract a "projet/proposition de loi …" segment. We match when the scrutin text contains the bill title or the extracted segment matches (longest match wins).

## Verified: source JSON (Scrutins ZIP, legislature 17)

Script `apps/ingestion/scripts/inspect-scrutins-json.ts` was run against the official ZIP. Findings:

- **Keys are camelCase**: `objet`, `demandeur`, `dossierLegislatif`, `referenceLegislative`, `libelle`. Our types and key-tolerant parsing are correct.
- **Explicit refs are never filled**: In 5 414 scrutins, **zero** have non-empty `objet.dossierLegislatif` or `objet.referenceLegislative` or `demandeur.referenceLegislative` — all are **null**.

So the publisher does **not** provide dossier IDs in this dataset. Linking can only be done via **title matching** (and the API fallback for amendment scrutins).

**Where the link does exist:** The **Dossiers législatifs** open data (same repository, `dossiers_legislatifs/Dossiers_Legislatifs.json.zip`) contains one JSON file per dossier with `uid` (e.g. `DLR5L17N53329`) and `titreDossier.titre` (e.g. "Empêcher la constitution de monopoles économiques dans les secteurs des médias"). Amendment scrutins refer to the same bill in natural language ("proposition de loi visant à empêcher la constitution de monopoles..."); the dossier title often omits the "Proposition de loi visant à" prefix. So we **match by the substantive part**: strip that prefix from the amendment segment and compare with bill titles (including a 38‑character prefix match so "dans le secteur" vs "dans les secteurs" still matches).

## Why the link is often missing

### 1. **No explicit refs in the open data (main cause)**

As verified above, `dossierLegislatif` and `referenceLegislative` are **always null** in the Scrutins ZIP. We must rely on title matching.

### 2. **`referenceLegislative` format**

We accept it as string or object (e.g. `{ "@value": "..." }`). If the source used another shape, we would miss it; in practice the field is null anyway.

### 3. **Bill not in our `bills` table**

We only link to a bill that **already exists** in `bills` (from dossiers ingestion). If dossiers ingestion has not been run for that legislature, or the dossier is not in the Dossiers ZIP we use, we cannot link even when title matching would succeed.

### 4. **Title matching is fragile**

The fallback requires the scrutin text (or an extracted "projet/proposition de loi …" segment) to **contain** the full normalized bill title, or the bill title to contain the segment. Amendments often use abbreviated or different wording, so the substring match can fail.

---

## What was done

- **Inspection**: Ran `apps/ingestion/scripts/inspect-scrutins-json.ts` to confirm key names and that refs are always null.
- **Parsing**: Ingestion tries multiple key variants and accepts `referenceLegislative` as string or object; when the publisher starts filling refs, they will be used.
- **Title matching**: For amendment-like libellé we extract a "projet de loi …" / "proposition de loi …" segment and allow matching when either the full text or that segment matches the bill title (see ingest-scrutins.ts).
- **API fallback**: The GET scrutin-by-id API resolves a bill by title when no `bill_scrutins` link exists and the scrutin looks like an amendment, so the UI can show the bill link without re-ingesting.

To re-verify the source shape in the future, run from the ingestion app: `npx ts-node scripts/inspect-scrutins-json.ts`.
