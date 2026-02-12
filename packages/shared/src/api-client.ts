/**
 * API Client for Agora
 * Provides typed methods to call the serverless API endpoints
 */

import {
  AgendaResponse,
  AgendaRangeResponse,
  SittingDetailResponse,
  ScrutinsResponse,
  ScrutinDetailResponse,
  DeputyVotesResponse,
  Deputy,
  PoliticalGroupsListResponse,
  PoliticalGroupDetail,
  CirconscriptionsListResponse,
  CirconscriptionDetail,
  CirconscriptionsGeoJSONResponse,
  DepartementsListResponse,
  DeputiesListResponse,
  SearchResponse,
  SearchType,
  ApiError,
  BillSummary,
  BillDetailResponse
} from "./types";

const API_NOT_JSON_MESSAGE =
  "L'API a renvoyé une page HTML au lieu de JSON. Vérifiez que l'API est démarrée (port 3001) et que NEXT_PUBLIC_API_URL pointe vers elle (ex. http://localhost:3001/api).";

/**
 * Parse response as JSON or throw a clear error if the body is HTML (e.g. 404 page).
 */
async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    if (
      text.trimStart().startsWith("<!") ||
      text.trimStart().toLowerCase().startsWith("<html")
    ) {
      throw new Error(API_NOT_JSON_MESSAGE);
    }
    throw new Error(
      `Réponse non-JSON (Content-Type: ${contentType}). ${API_NOT_JSON_MESSAGE}`
    );
  }
  return response.json() as Promise<T>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Ensure baseUrl is a string
    if (typeof baseUrl !== "string") {
      throw new Error(
        `ApiClient: baseUrl must be a string, got ${typeof baseUrl}`
      );
    }
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Fetch agenda for a specific date
   */
  async getAgenda(date: string): Promise<AgendaResponse> {
    const response = await fetch(`${this.baseUrl}/agenda?date=${date}`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch agenda");
    }

    return (await response.json()) as AgendaResponse;
  }

  /**
   * Fetch agenda for a date range
   */
  async getAgendaRange(from: string, to: string): Promise<AgendaRangeResponse> {
    const response = await fetch(
      `${this.baseUrl}/agenda/range?from=${from}&to=${to}`
    );

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch agenda range");
    }

    return (await response.json()) as AgendaRangeResponse;
  }

  /**
   * Fetch detailed sitting information
   */
  async getSitting(id: string): Promise<SittingDetailResponse> {
    const response = await fetch(`${this.baseUrl}/sittings/${id}`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch sitting");
    }

    return (await response.json()) as SittingDetailResponse;
  }

  /**
   * Fetch scrutins (roll-call votes) for a date range
   * @param tag Optional tag slug to filter by
   * @param group Optional political group slug (e.g. "rn", "lfi") to filter scrutins
   * @param group_position Optional majority position of the group: "pour" | "contre" | "abstention"
   */
  async getScrutins(
    from: string,
    to: string,
    tag?: string,
    group?: string,
    group_position?: "pour" | "contre" | "abstention"
  ): Promise<ScrutinsResponse> {
    const params = new URLSearchParams({ from, to });
    if (tag) {
      params.append("tag", tag);
    }
    if (group) {
      params.set("group", group);
    }
    if (group_position) {
      params.set("group_position", group_position);
    }
    const response = await fetch(
      `${this.baseUrl}/scrutins?${params.toString()}`
    );

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch scrutins");
    }

    return (await response.json()) as ScrutinsResponse;
  }

  /**
   * Fetch a single scrutin by ID (UUID or official_id)
   */
  async getScrutin(id: string): Promise<ScrutinDetailResponse> {
    const response = await fetch(`${this.baseUrl}/scrutins/${id}`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch scrutin");
    }

    return (await response.json()) as ScrutinDetailResponse;
  }

  /**
   * Fetch deputy profile by acteur_ref (e.g. PA842279)
   */
  async getDeputy(acteurRef: string): Promise<Deputy> {
    const encoded = encodeURIComponent(acteurRef);
    const response = await fetch(`${this.baseUrl}/deputy/${encoded}`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch deputy");
    }

    return (await response.json()) as Deputy;
  }

  /**
   * Fetch voting record for a deputy by acteur_ref (e.g. PA842279)
   */
  async getDeputyVotes(acteurRef: string): Promise<DeputyVotesResponse> {
    const encoded = encodeURIComponent(acteurRef);
    const response = await fetch(`${this.baseUrl}/deputies/${encoded}/votes`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Failed to fetch deputy votes");
    }

    return (await response.json()) as DeputyVotesResponse;
  }

  /**
   * Fetch list of political groups (groupes politiques) with deputy counts
   */
  async getPoliticalGroups(): Promise<PoliticalGroupsListResponse> {
    const response = await fetch(`${this.baseUrl}/groups`);

    const data = await parseJsonOrThrow<PoliticalGroupsListResponse | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || "Failed to fetch political groups");
    }

    return data as PoliticalGroupsListResponse;
  }

  /**
   * Fetch a political group by slug with its deputies
   */
  async getPoliticalGroup(slug: string): Promise<PoliticalGroupDetail> {
    const encoded = encodeURIComponent(slug);
    const response = await fetch(`${this.baseUrl}/groups/${encoded}`);

    const data = await parseJsonOrThrow<PoliticalGroupDetail | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || "Failed to fetch political group");
    }

    return data as PoliticalGroupDetail;
  }

  /**
   * Fetch list of circonscriptions (electoral constituencies) with deputy counts
   */
  async getCirconscriptions(): Promise<CirconscriptionsListResponse> {
    const response = await fetch(`${this.baseUrl}/circonscriptions`);

    const data = await parseJsonOrThrow<
      CirconscriptionsListResponse | ApiError
    >(response);

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message ?? "Failed to fetch circonscriptions");
    }

    return data as CirconscriptionsListResponse;
  }

  /**
   * Fetch GeoJSON FeatureCollection of all circonscriptions (id, label, geometry)
   * for use as an overlay on a map of France.
   */
  async getCirconscriptionsGeojson(): Promise<CirconscriptionsGeoJSONResponse> {
    const response = await fetch(`${this.baseUrl}/circonscriptions/geojson`);
    if (!response.ok) {
      throw new Error("Failed to fetch circonscriptions GeoJSON");
    }
    return (await response.json()) as CirconscriptionsGeoJSONResponse;
  }

  /**
   * Fetch a circonscription by id (e.g. "1801", "7505") with its deputies
   */
  async getCirconscription(id: string): Promise<CirconscriptionDetail> {
    const encoded = encodeURIComponent(id);
    const response = await fetch(`${this.baseUrl}/circonscriptions/${encoded}`);

    const data = await parseJsonOrThrow<CirconscriptionDetail | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message ?? "Circonscription not found");
    }

    return data as CirconscriptionDetail;
  }

  /**
   * Fetch list of départements with deputy count (current mandate) for "Mon député" selector
   */
  async getDepartements(): Promise<DepartementsListResponse> {
    const response = await fetch(`${this.baseUrl}/departements`);

    const data = await parseJsonOrThrow<DepartementsListResponse | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message ?? "Failed to fetch departements");
    }

    return data as DepartementsListResponse;
  }

  /**
   * Fetch deputies by département name (e.g. "Paris", "Yvelines")
   */
  async getDeputiesByDepartement(
    departement: string
  ): Promise<DeputiesListResponse> {
    const params = new URLSearchParams({ departement: departement.trim() });
    const response = await fetch(
      `${this.baseUrl}/deputies?${params.toString()}`
    );

    const data = await parseJsonOrThrow<DeputiesListResponse | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message ?? "Failed to fetch deputies");
    }

    return data as DeputiesListResponse;
  }

  /**
   * Search scrutins, deputies, and/or groups by query string
   */
  async search(
    q: string,
    type: SearchType = "all",
    options?: {
      group?: string;
      group_position?: "pour" | "contre" | "abstention";
    }
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: q.trim() });
    if (type !== "all") {
      params.set("type", type);
    }
    if (options?.group) {
      params.set("group", options.group);
    }
    if (options?.group_position) {
      params.set("group_position", options.group_position);
    }
    const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || "Search failed");
    }

    return (await response.json()) as SearchResponse;
  }

  /**
   * Fetch list of bills (legislative texts) with basic summary information
   */
  async getBills(params?: {
    q?: string;
    type?: string;
    tag?: string;
    has_votes?: boolean;
  }): Promise<BillSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.q) {
      searchParams.set("q", params.q.trim());
    }
    if (params?.type) {
      searchParams.set("type", params.type.trim());
    }
    if (params?.tag) {
      searchParams.set("tag", params.tag.trim());
    }
    if (params?.has_votes) {
      searchParams.set("has_votes", "true");
    }
    const query = searchParams.toString();
    const url =
      query.length > 0
        ? `${this.baseUrl}/bills?${query}`
        : `${this.baseUrl}/bills`;

    const response = await fetch(url);
    const data = await parseJsonOrThrow<{ bills: BillSummary[] } | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || "Failed to fetch bills");
    }

    return (data as { bills: BillSummary[] }).bills;
  }

  /**
   * Fetch detailed bill information by UUID or official_id
   */
  async getBill(id: string): Promise<BillDetailResponse> {
    const encoded = encodeURIComponent(id);
    const response = await fetch(`${this.baseUrl}/bills/${encoded}`);

    const data = await parseJsonOrThrow<BillDetailResponse | ApiError>(
      response
    );

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || "Failed to fetch bill");
    }

    return data as BillDetailResponse;
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
