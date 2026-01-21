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
