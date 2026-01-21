/**
 * API Client for Agora
 * Provides typed methods to call the serverless API endpoints
 */

import {
  AgendaResponse,
  AgendaRangeResponse,
  SittingDetailResponse,
  ApiError,
} from './types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Fetch agenda for a specific date
   */
  async getAgenda(date: string): Promise<AgendaResponse> {
    const response = await fetch(`${this.baseUrl}/agenda?date=${date}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to fetch agenda');
    }

    return response.json();
  }

  /**
   * Fetch agenda for a date range
   */
  async getAgendaRange(from: string, to: string): Promise<AgendaRangeResponse> {
    const response = await fetch(
      `${this.baseUrl}/agenda/range?from=${from}&to=${to}`
    );

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to fetch agenda range');
    }

    return response.json();
  }

  /**
   * Fetch detailed sitting information
   */
  async getSitting(id: string): Promise<SittingDetailResponse> {
    const response = await fetch(`${this.baseUrl}/sittings/${id}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to fetch sitting');
    }

    return response.json();
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
