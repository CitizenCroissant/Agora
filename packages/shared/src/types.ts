/**
 * Domain types for Agora
 * Represents the data model for Assemblée nationale agenda items
 */

/** Contract for app config (API base URL); resolution is app-specific (env, expo, etc.). */
export type AppConfig = { API_URL: string };

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

/**
 * Legislative text / bill (dossier législatif)
 */
export interface Bill {
  id: string;
  official_id: string;
  title: string;
  short_title?: string | null;
  type?: string | null;
  origin?: string | null;
  official_url?: string | null;
}

export interface BillSummary extends Bill {
  /** Date of the most recent related scrutin (YYYY-MM-DD) */
  latest_scrutin_date?: string | null;
  /** Number of related scrutins when available */
  scrutins_count?: number | null;
}

export interface BillDetailResponse extends Bill {
  scrutins: Scrutin[];
  /** Optional sittings where this bill appears on the agenda */
  sittings?: SittingWithItems[];
}

export interface SittingDetailResponse extends SittingWithItems {
  source_metadata: SourceMetadata;
  /** Scrutins (votes) held during this sitting */
  scrutins?: Scrutin[];
}

/**
 * Thematic tag types
 */

export interface ThematicTag {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  color?: string | null;
}

/**
 * Scrutin (roll-call vote) types
 */

export interface Scrutin {
  id: string;
  official_id: string;
  sitting_id: string | null;
  date_scrutin: string; // YYYY-MM-DD
  numero: string;
  type_vote_code: string | null;
  type_vote_libelle: string | null;
  sort_code: string; // 'adopté' | 'rejeté'
  sort_libelle: string | null;
  titre: string;
  synthese_pour: number;
  synthese_contre: number;
  synthese_abstentions: number;
  synthese_non_votants: number;
  official_url: string | null;
  tags?: ThematicTag[];
}

export type ScrutinVotePosition =
  | "pour"
  | "contre"
  | "abstention"
  | "non_votant";

export interface ScrutinVote {
  id: string;
  scrutin_id: string;
  acteur_ref: string;
  position: ScrutinVotePosition;
}

/** Scrutin vote with optional deputy display name (when deputies table is populated) */
export interface ScrutinVoteWithName extends ScrutinVote {
  acteur_nom?: string | null;
}

/** Per-political-group breakdown for a single scrutin */
export interface ScrutinGroupVoteSummary {
  /** Label of the political group (e.g. "RN", "SOC") */
  groupe_politique: string;
  /** Total number of deputies from this group in the vote */
  total: number;
  /** Raw counts by position */
  pour: number;
  contre: number;
  abstention: number;
  non_votant: number;
  /** Percentages by position (0-100, rounded) */
  pour_pct: number;
  contre_pct: number;
  abstention_pct: number;
  non_votant_pct: number;
}

export interface ScrutinWithVotes extends Scrutin {
  votes?: ScrutinVote[];
}

export interface ScrutinsResponse {
  from: string;
  to: string;
  scrutins: Scrutin[];
  source: {
    label: string;
    last_updated_at?: string;
  };
}

export interface ScrutinDetailResponse extends Scrutin {
  votes?: ScrutinVoteWithName[];
  tags?: ThematicTag[];
  /** Optional per-political-group vote breakdown */
  group_votes?: ScrutinGroupVoteSummary[];
  /**
   * Optional linked legislative text (bill / dossier législatif) when available.
   */
  bill?: {
    id: string;
    official_id: string;
    title: string;
    short_title?: string | null;
  } | null;
}

/** Single vote record for deputy voting record */
export interface DeputyVoteRecord {
  scrutin_id: string;
  scrutin_titre: string;
  date_scrutin: string;
  position: ScrutinVotePosition;
}

export interface DeputyVotesResponse {
  acteur_ref: string;
  /** Display name when deputy is in deputies table */
  acteur_nom?: string | null;
  votes: DeputyVoteRecord[];
}

export interface Deputy {
  acteur_ref: string;
  civil_nom: string;
  civil_prenom: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  profession: string | null;
  sexe: string | null;
  parti_politique: string | null;
  groupe_politique: string | null;
  circonscription: string | null;
  /** Official ref (canonical) for circonscription URL, e.g. "7505", "0101" */
  circonscription_ref: string | null;
  departement: string | null;
  date_debut_mandat: string | null;
  /** End of mandate (YYYY-MM-DD). Null = current mandate or unknown. */
  date_fin_mandat: string | null;
  legislature: number | null;
  official_url: string | null;
}

/** Political position: majority, opposition, or minority */
export type PoliticalPosition = "majoritaire" | "opposition" | "minoritaire";

/** Political orientation: left, center, right */
export type PoliticalOrientation = "gauche" | "centre" | "droite";

/** Optional metadata for a political group (from political_groups_metadata) */
export interface PoliticalGroupMetadata {
  date_debut?: string | null;
  date_fin?: string | null;
  position_politique?: PoliticalPosition | null;
  orientation?: PoliticalOrientation | null;
  color_hex?: string | null;
  president_name?: string | null;
  legislature?: number | null;
  official_url?: string | null;
}

/** Political group (groupe politique) summary for list */
export interface PoliticalGroupSummary {
  slug: string;
  label: string;
  deputy_count: number;
  /** Optional metadata when available */
  metadata?: PoliticalGroupMetadata | null;
}

/** Political group detail with deputies */
export interface PoliticalGroupDetail {
  slug: string;
  label: string;
  deputy_count: number;
  deputies: Deputy[];
  /** Optional metadata (dates, position, orientation, president) */
  metadata?: PoliticalGroupMetadata | null;
}

export interface PoliticalGroupsListResponse {
  groups: PoliticalGroupSummary[];
}

/** Circonscription (electoral constituency) summary for list */
export interface CirconscriptionSummary {
  id: string;
  label: string;
  deputy_count: number;
}

/** Circonscription detail with deputies */
export interface CirconscriptionDetail {
  id: string;
  label: string;
  deputy_count: number;
  deputies: Deputy[];
}

export interface CirconscriptionsListResponse {
  circonscriptions: CirconscriptionSummary[];
}

/** Department (département) summary for "Mon député" selector */
export interface DepartementSummary {
  name: string;
  deputy_count: number;
}

export interface DepartementsListResponse {
  departements: DepartementSummary[];
}

/** List of deputies (e.g. by departement or circonscription) */
export interface DeputiesListResponse {
  deputies: Deputy[];
}

/** GeoJSON geometry for map overlay (Polygon or MultiPolygon) */
export type CirconscriptionGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

/** GeoJSON Feature for one circonscription (id, label in properties) */
export interface CirconscriptionGeoJSONFeature {
  type: "Feature";
  properties: { id: string; label: string };
  geometry: CirconscriptionGeometry;
}

/** GeoJSON FeatureCollection returned by GET /circonscriptions/geojson for map overlay */
export interface CirconscriptionsGeoJSONResponse {
  type: "FeatureCollection";
  features: CirconscriptionGeoJSONFeature[];
}

/**
 * Search result types
 */
export type SearchType = "scrutins" | "deputies" | "groups" | "all";

export interface SearchResponse {
  q: string;
  scrutins: Scrutin[];
  deputies: Deputy[];
  groups: PoliticalGroupSummary[];
}

/**
 * API Error types
 */

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
