/**
 * Minimal types for Assemblée nationale Amendements JSON (lightweight Option B).
 * We only need dossier ref and numero to link scrutins to amendments.
 * Schema varies by export; we parse flexibly (camelCase / PascalCase).
 */

/** Raw amendment as we parse from the ZIP (one file per amendment or wrapper). */
export interface AssembleeAmendmentRaw {
  uid?: string;
  /** Dossier législatif ref (matches bills.official_id when present). */
  dossierRef?: string | null;
  /** Amendment number for display and matching (e.g. "123", "456 rect."). */
  numero?: string | null;
  /** Sometimes nested under identifiant or similar. */
  identifiant?: { numero?: string } | null;
  /** Optional: sort (adopté/rejeté). */
  sort?: { code?: string; libelle?: string } | null;
}

/** One amendment row we upsert into the DB. Amendments link to a bill_text (texte), not the bill. */
export interface AmendmentInsert {
  bill_text_id: string;
  official_id: string;
  numero: string;
  official_url: string | null;
  /** Leading digits of numero for numeric ordering (set by ingestion). */
  numero_sort?: number | null;
}
