/**
 * Domain types for Agora
 * Represents the data model for Assemblée nationale agenda items
 */

export interface Sitting {
  id: string;
  official_id: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM:SS
  end_time?: string; // HH:MM:SS
  type: string; // e.g., 'seance_publique'
  title: string;
  description: string;
  location?: string;
  agenda_items?: AgendaItem[];
  source_metadata?: SourceMetadata;
}

export interface AgendaItem {
  id: string;
  sitting_id: string;
  scheduled_time?: string; // HH:MM:SS
  title: string;
  description: string;
  category: string;
  reference_code?: string;
  official_url?: string;
}

export interface SourceMetadata {
  id: string;
  sitting_id: string;
  original_source_url: string;
  last_synced_at: string; // ISO 8601 timestamp
  checksum: string;
}

/**
 * API Response types
 */

export interface AgendaResponse {
  date: string;
  sittings: SittingWithItems[];
  source: {
    label: string;
    last_updated_at: string;
  };
}

export interface SittingWithItems extends Sitting {
  time_range?: string;
  agenda_items: AgendaItem[];
}

export interface AgendaRangeResponse {
  from: string;
  to: string;
  agendas: AgendaResponse[];
}

export interface SittingDetailResponse extends SittingWithItems {
  source_metadata: SourceMetadata;
}

/**
 * API Error types
 */

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
