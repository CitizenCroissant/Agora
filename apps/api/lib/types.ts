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
  organe_ref: string | null;
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

export interface DbBill {
  id: string;
  official_id: string;
  title: string;
  short_title: string | null;
  type: string | null;
  origin: string | null;
  official_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBillScrutin {
  bill_id: string;
  scrutin_id: string;
  role: string | null;
  created_at: string;
}

export interface DbScrutinVote {
  id: string;
  scrutin_id: string;
  acteur_ref: string;
  position: string;
  created_at: string;
}

export interface DbThematicTag {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScrutinThematicTag {
  id: string;
  scrutin_id: string;
  tag_id: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface DbBillThematicTag {
  id: string;
  bill_id: string;
  tag_id: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface DbOrgane {
  id: string;
  libelle: string | null;
  libelle_abrege: string | null;
  type_organe: string;
  official_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSittingAttendance {
  id: string;
  sitting_id: string;
  acteur_ref: string;
  presence: string;
  created_at: string;
  updated_at: string;
}
