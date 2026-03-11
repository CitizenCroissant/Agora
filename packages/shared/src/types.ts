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
  type: string; // e.g. 'seance_type', 'reunionCommission_type'
  title: string;
  description: string;
  location?: string;
  organe_ref?: string | null;
  /** Commission/organe when organe_ref is set (name and link). Populated by API when available. */
  organe?: Organe | null;
  agenda_items?: AgendaItem[];
  source_metadata?: SourceMetadata;
}

/** Parliamentary organ (commission, delegation, etc.) from AMO open data */
export interface Organe {
  id: string;
  libelle: string | null;
  libelle_abrege: string | null;
  type_organe: string;
  official_url: string | null;
}

/** Member of a commission/organe (from GET /api/commissions/:id/members) */
export interface CommissionMember {
  acteur_ref: string;
  civil_nom: string | null;
  civil_prenom: string | null;
  groupe_politique: string | null;
}

/** One commission/organe type from GET /api/commissions/types */
export interface CommissionType {
  code: string;
  label: string;
}

export interface CommissionTypesResponse {
  types: CommissionType[];
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
  /** Campaign themes matched from title/description (e.g. for election hub). */
  campaign_topics?: CampaignTopic[];
}

/** Campaign theme for election-related tagging of agenda items */
export interface CampaignTopic {
  slug: string;
  label: string;
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
 * Legislative dossier / bill (dossier législatif).
 * One per bill initiative; the Assemblée also has "textes" (document versions) per dossier.
 * @see docs/DOSSIER_VS_TEXTE.md
 */
export interface Bill {
  id: string;
  official_id: string;
  title: string;
  short_title?: string | null;
  type?: string | null;
  origin?: string | null;
  official_url?: string | null;
  tags?: ThematicTag[];
}

export interface BillSummary extends Bill {
  /** Date of the most recent related scrutin (YYYY-MM-DD) */
  latest_scrutin_date?: string | null;
  /** Number of related scrutins when available */
  scrutins_count?: number | null;
}

/** Paginated list of bills from GET /api/bills */
export interface BillsListResponse {
  bills: BillSummary[];
  limit: number;
  offset: number;
  has_more: boolean;
}

/** Minimal bill info for "amended" (parent) bill when this bill is an amendment */
export interface BillAmendsBill {
  id: string;
  official_id: string;
  title: string;
  short_title?: string | null;
}

/** Synthetic summary of amendments for a bill (no full list; bills can have hundreds). */
export interface BillAmendmentsSummary {
  /** Total number of amendments deposited for this bill */
  total: number;
  /** Number of those amendments that have been put to a vote (linked to at least one scrutin) */
  with_scrutin_count?: number;
}

/** One document version (texte) of a bill with its amendment count. */
export interface BillTextWithCount {
  id: string;
  texte_ref: string;
  numero?: string | null;
  label?: string | null;
  official_url?: string | null;
  /** Number of amendments deposited on this version. */
  amendments_count: number;
}

/** Minimal scrutin info for "vote(s) on this amendment" links in amendment list */
export interface AmendmentScrutinRef {
  id: string;
  date_scrutin: string;
  titre: string;
  sort_code: string;
  official_url: string | null;
}

/** One amendment in a bill's paginated amendment list (drill-down). */
export interface AmendmentListItem {
  id: string;
  official_id: string;
  numero: string;
  official_url: string | null;
  /** Scrutin(s) that voted on this amendment, when linked */
  scrutins?: AmendmentScrutinRef[];
}

/** Paginated list of amendments for a bill (GET /api/bills/:id/amendments). */
export interface BillAmendmentsListResponse {
  /** Bill context so the page can show title without a separate request */
  bill: { id: string; official_id: string; title: string; short_title?: string | null };
  amendments: AmendmentListItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface BillDetailResponse extends Bill {
  scrutins: Scrutin[];
  /** Optional sittings where this bill appears on the agenda */
  sittings?: SittingWithItems[];
  /** When this bill is an amendment, the main bill it amends */
  amends_bill?: BillAmendsBill | null;
  /** Synthetic amendments summary (counts only; full list on official site) */
  amendments_summary?: BillAmendmentsSummary | null;
  /** Document versions (textes) of this dossier with amendment count per version */
  textes?: BillTextWithCount[];
}

/** One attendance record for a commission reunion (présent / absent / excusé) */
export interface SittingAttendanceEntry {
  acteur_ref: string;
  presence: "présent" | "absent" | "excusé";
  /** Display name when deputy is in deputies table */
  acteur_nom?: string | null;
}

export interface SittingDetailResponse extends SittingWithItems {
  source_metadata: SourceMetadata;
  /** Scrutins (votes) held during this sitting */
  scrutins?: Scrutin[];
  /** Attendance for commission reunions only (official open data) */
  attendance?: SittingAttendanceEntry[];
  /** Commission/organe when organe_ref is set (name and link) */
  organe?: Organe | null;
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
  /** Full official description of what is being voted on (plain-language context). */
  objet_libelle?: string | null;
  /** Who requested the vote (e.g. "Président du groupe X"). */
  demandeur_texte?: string | null;
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
  /** Political group label when deputy is in deputies table */
  groupe_politique?: string | null;
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
  /** Percentage of this group that voted like the assembly outcome (pour if adopté, contre if rejeté). 0-100. */
  pct_voted_like_assembly?: number;
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
  /**
   * When this is an amendment and no bill link exists, the API may suggest a title (extracted from the amendment text) so the UI can link to bill search.
   */
  bill_suggestion?: { title: string } | null;
}

/** Single vote record for deputy voting record */
export interface DeputyVoteRecord {
  scrutin_id: string;
  scrutin_titre: string;
  date_scrutin: string;
  position: ScrutinVotePosition;
}

/** Comparison context for one vote when enrich=comparison is requested */
export interface DeputyVoteComparison {
  /** Assembly outcome for this scrutin */
  assembly_result: "adopté" | "rejeté";
  /** Deputy's political group label */
  group_label: string;
  group_pour_pct: number;
  group_contre_pct: number;
  group_abstention_pct: number;
  group_non_votant_pct: number;
}

/** Vote record with optional comparison (when GET /deputies/:ref/votes?enrich=comparison) */
export interface DeputyVoteRecordWithComparison extends DeputyVoteRecord {
  comparison?: DeputyVoteComparison | null;
}

export interface DeputyVotesResponse {
  acteur_ref: string;
  /** Display name when deputy is in deputies table */
  acteur_nom?: string | null;
  votes: DeputyVoteRecord[] | DeputyVoteRecordWithComparison[];
}

/** One attendance record for a deputy at a commission reunion (from GET /api/deputies/:acteurRef/attendance) */
export interface DeputyAttendanceEntry {
  sitting_id: string;
  sitting_title: string;
  date: string;
  presence: "présent" | "absent" | "excusé";
}

export interface DeputyAttendanceResponse {
  acteur_ref: string;
  acteur_nom?: string | null;
  attendance: DeputyAttendanceEntry[];
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
  /** Commissions and other organes the deputy is a member of (from deputy_organes). */
  commissions?: Organe[];
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

/**
 * Elections - candidates by circonscription (for legislative elections).
 * Designed so we can plug in the official data.gouv.fr dataset when available.
 */
export interface ElectionCandidate {
  id: string;
  /** Election year, e.g. 2026. */
  year: number;
  /** Canonical circonscription ID (e.g. "7505", "0101"). */
  circonscription_id: string;
  nom: string;
  prenom: string;
  sexe?: string | null;
  /** Short party/nuance code when available (e.g. "REN", "RN"). */
  nuance?: string | null;
  /** Human-readable label for the nuance when available. */
  nuance_label?: string | null;
  /** Whether this candidate is the incumbent deputy for this circonscription. */
  is_incumbent?: boolean | null;
  /** Optional reference to the current deputy in deputies table when matched. */
  current_deputy_ref?: string | null;
  /** Optional embedded deputy details when joined (for richer UI without extra request). */
  current_deputy?: Deputy | null;
  /** Optional rough count of past mandates when derivable from data. */
  past_mandates_count?: number | null;
}

export interface CirconscriptionElectionCandidatesResponse {
  year: number;
  circonscription: {
    id: string;
    label: string;
  };
  candidates: ElectionCandidate[];
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
 * Ingestion status (data freshness) - GET /ingestion-status
 */
export interface IngestionStatusResponse {
  ok: boolean;
  agenda: {
    latest_sitting_date: string | null;
    last_synced_at: string | null;
    is_fresh: boolean;
  };
  checked_at: string;
}

/**
 * Follows ("I'm following this") - deputy, bill, or group
 */
export type FollowType = "deputy" | "bill" | "group";

export interface FollowItem {
  follow_type: FollowType;
  follow_id: string;
}

/** Response from GET /api/follows: list of followed entities by type */
export interface FollowsListResponse {
  follows: {
    deputy: string[];
    bill: string[];
    group: string[];
  };
}

/**
 * API Error types
 */

export interface ApiError {
  error: string;
  message: string;
  status: number;
}
