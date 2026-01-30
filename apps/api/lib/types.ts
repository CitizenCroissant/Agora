/**
 * Database types matching Supabase schema
 */

export interface DbSitting {
  id: string;
  official_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  title: string;
  description: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAgendaItem {
  id: string;
  sitting_id: string;
  scheduled_time: string | null;
  title: string;
  description: string;
  category: string;
  reference_code: string | null;
  official_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSourceMetadata {
  id: string;
  sitting_id: string;
  original_source_url: string;
  last_synced_at: string;
  checksum: string;
  created_at: string;
  updated_at: string;
}

export interface DbScrutin {
  id: string;
  official_id: string;
  sitting_id: string | null;
  date_scrutin: string;
  numero: string;
  type_vote_code: string | null;
  type_vote_libelle: string | null;
  sort_code: string;
  sort_libelle: string | null;
  titre: string;
  synthese_pour: number;
  synthese_contre: number;
  synthese_abstentions: number;
  synthese_non_votants: number;
  official_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScrutinVote {
  id: string;
  scrutin_id: string;
  acteur_ref: string;
  position: string;
  created_at: string;
}
