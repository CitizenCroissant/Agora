import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, createApiClient } from '../api-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiClient', () => {
  let client: ApiClient;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    client = new ApiClient(baseUrl);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const clientWithSlash = new ApiClient('https://api.example.com/');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((clientWithSlash as any).baseUrl).toBe('https://api.example.com');
    });
  });

  describe('getAgenda', () => {
    it('should fetch agenda for a specific date', async () => {
      const mockResponse = {
        date: '2024-01-15',
        sittings: [],
        source: { label: 'Test', last_updated_at: '2024-01-15T10:00:00Z' }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getAgenda('2024-01-15');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/agenda?date=2024-01-15'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed request', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'NotFound',
          message: 'Agenda not found',
          status: 404
        })
      });

      await expect(client.getAgenda('2024-01-15')).rejects.toThrow(
        'Agenda not found'
      );
    });
  });

  describe('getAgendaRange', () => {
    it('should fetch agenda for a date range', async () => {
      const mockResponse = {
        from: '2024-01-15',
        to: '2024-01-20',
        agendas: []
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getAgendaRange('2024-01-15', '2024-01-20');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/agenda/range?from=2024-01-15&to=2024-01-20'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSitting', () => {
    it('should fetch sitting details', async () => {
      const mockResponse = {
        id: 'sit-123',
        official_id: 'OFF-123',
        date: '2024-01-15',
        type: 'seance_publique',
        title: 'Test Sitting',
        description: 'Test Description',
        agenda_items: [],
        source_metadata: {
          id: 'meta-123',
          sitting_id: 'sit-123',
          original_source_url: 'https://example.com',
          last_synced_at: '2024-01-15T10:00:00Z',
          checksum: 'abc123'
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getSitting('sit-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/sittings/sit-123'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createApiClient', () => {
    it('should create an ApiClient instance', () => {
      const client = createApiClient(baseUrl);
      expect(client).toBeInstanceOf(ApiClient);
    });
  });
});
