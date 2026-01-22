import { describe, it, expect, vi } from 'vitest';
import { ApiError, handleError, validateDateFormat } from '../errors';

describe('errors', () => {
  describe('ApiError', () => {
    it('should create an ApiError with correct properties', () => {
      const error = new ApiError(404, 'Not Found', 'NotFound');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.error).toBe('NotFound');
      expect(error.name).toBe('ApiError');
    });

    it('should use default error name if not provided', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error.error).toBe('ApiError');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle ApiError correctly', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const error = new ApiError(404, 'Not Found', 'NotFound');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleError(mockRes as any, error);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'NotFound',
        message: 'Not Found',
        status: 404,
      });
    });

    it('should handle unknown errors as 500', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const error = new Error('Unknown error');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleError(mockRes as any, error);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        status: 500,
      });
    });
  });

  describe('validateDateFormat', () => {
    it('should validate correct date formats', () => {
      expect(validateDateFormat('2024-01-15')).toBe(true);
      expect(validateDateFormat('2024-12-31')).toBe(true);
      expect(validateDateFormat('2000-01-01')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(validateDateFormat('2024-1-15')).toBe(false);
      expect(validateDateFormat('2024/01/15')).toBe(false);
      expect(validateDateFormat('15-01-2024')).toBe(false);
      expect(validateDateFormat('not-a-date')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(validateDateFormat('2024-13-01')).toBe(false); // Invalid month
      expect(validateDateFormat('2024-02-30')).toBe(false); // Invalid day
    });
  });
});
