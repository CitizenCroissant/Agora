/**
 * Types for Assemblée nationale data
 */

// Official API response types
export interface AssembleeSeance {
  uid: string;
  legislature: number;
  dateSeance: string; // YYYY-MM-DD
  heureDebut?: string;
  heureFin?: string;
  typeSeance: string;
  intitule: string;
  organeRef: string;
  lieuLibelle?: string;
  pointsOdj?: AssembleePointOdj[];
}

export interface AssembleePointOdj {
  numero?: number;
  intitule: string;
  nature?: string;
  texteRef?: string;
  heureDebut?: string;
}

// Database insert types
export interface SittingInsert {
  official_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: string;
  title: string;
  description: string;
  location?: string;
}

export interface AgendaItemInsert {
  sitting_id: string;
  scheduled_time?: string;
  title: string;
  description: string;
  category: string;
  reference_code?: string;
  official_url?: string;
}

export interface SourceMetadataInsert {
  sitting_id: string;
  original_source_url: string;
  last_synced_at: string;
  checksum: string;
}
