import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatTimeRange,
  getTodayDate,
  addDays,
  subtractDays,
  isToday,
  getDateRange,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addWeeks,
  addMonths,
  formatDateRange,
  formatMonth,
} from '../utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('should format date to French locale', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('janvier');
      expect(result).toContain('2024');
    });
  });

  describe('formatTime', () => {
    it('should format time string HH:MM:SS to HH:MM', () => {
      expect(formatTime('14:30:00')).toBe('14:30');
      expect(formatTime('09:15:45')).toBe('09:15');
    });

    it('should return empty string for undefined', () => {
      expect(formatTime(undefined)).toBe('');
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range with both start and end', () => {
      expect(formatTimeRange('09:00:00', '17:00:00')).toBe('09:00 - 17:00');
    });

    it('should format only start time if no end time', () => {
      expect(formatTimeRange('09:00:00', undefined)).toBe('09:00');
    });

    it('should return empty string if both times are missing', () => {
      expect(formatTimeRange(undefined, undefined)).toBe('');
    });
  });

  describe('getTodayDate', () => {
    it('should return today date in YYYY-MM-DD format', () => {
      const result = getTodayDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      expect(addDays('2024-01-15', 5)).toBe('2024-01-20');
      expect(addDays('2024-01-15', 0)).toBe('2024-01-15');
    });

    it('should handle month boundaries', () => {
      expect(addDays('2024-01-30', 5)).toBe('2024-02-04');
    });

    it('should handle year boundaries', () => {
      expect(addDays('2024-12-30', 5)).toBe('2025-01-04');
    });
  });

  describe('subtractDays', () => {
    it('should subtract days from a date', () => {
      expect(subtractDays('2024-01-20', 5)).toBe('2024-01-15');
    });

    it('should handle month boundaries', () => {
      expect(subtractDays('2024-02-04', 5)).toBe('2024-01-30');
    });
  });

  describe('isToday', () => {
    it('should return true for today date', () => {
      const today = getTodayDate();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range', () => {
      const result = getDateRange('2024-01-15', 3, 3);
      expect(result).toEqual({
        from: '2024-01-12',
        to: '2024-01-18',
      });
    });

    it('should handle asymmetric ranges', () => {
      const result = getDateRange('2024-01-15', 7, 1);
      expect(result).toEqual({
        from: '2024-01-08',
        to: '2024-01-16',
      });
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday for a date in the middle of the week', () => {
      // Wednesday Jan 17, 2024 -> Monday Jan 15, 2024
      expect(getWeekStart('2024-01-17')).toBe('2024-01-15');
    });

    it('should return Monday for a Monday', () => {
      expect(getWeekStart('2024-01-15')).toBe('2024-01-15');
    });

    it('should return Monday for a Sunday', () => {
      // Sunday Jan 21, 2024 -> Monday Jan 15, 2024
      expect(getWeekStart('2024-01-21')).toBe('2024-01-15');
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday for a date in the middle of the week', () => {
      // Wednesday Jan 17, 2024 -> Sunday Jan 21, 2024
      expect(getWeekEnd('2024-01-17')).toBe('2024-01-21');
    });

    it('should return Sunday for a Monday', () => {
      expect(getWeekEnd('2024-01-15')).toBe('2024-01-21');
    });

    it('should return Sunday for a Sunday', () => {
      expect(getWeekEnd('2024-01-21')).toBe('2024-01-21');
    });
  });

  describe('getMonthStart', () => {
    it('should return first day of the month', () => {
      expect(getMonthStart('2024-01-15')).toBe('2024-01-01');
      expect(getMonthStart('2024-02-28')).toBe('2024-02-01');
      expect(getMonthStart('2024-12-31')).toBe('2024-12-01');
    });

    it('should work for first day of month', () => {
      expect(getMonthStart('2024-01-01')).toBe('2024-01-01');
    });
  });

  describe('getMonthEnd', () => {
    it('should return last day of the month', () => {
      expect(getMonthEnd('2024-01-15')).toBe('2024-01-31');
      expect(getMonthEnd('2024-02-15')).toBe('2024-02-29'); // Leap year
      expect(getMonthEnd('2023-02-15')).toBe('2023-02-28'); // Non-leap year
      expect(getMonthEnd('2024-04-15')).toBe('2024-04-30');
    });
  });

  describe('addWeeks', () => {
    it('should add weeks to a date', () => {
      expect(addWeeks('2024-01-15', 1)).toBe('2024-01-22');
      expect(addWeeks('2024-01-15', 2)).toBe('2024-01-29');
    });

    it('should subtract weeks with negative value', () => {
      expect(addWeeks('2024-01-22', -1)).toBe('2024-01-15');
    });
  });

  describe('addMonths', () => {
    it('should add months to a date', () => {
      expect(addMonths('2024-01-15', 1)).toBe('2024-02-15');
      expect(addMonths('2024-01-15', 2)).toBe('2024-03-15');
    });

    it('should subtract months with negative value', () => {
      expect(addMonths('2024-03-15', -1)).toBe('2024-02-15');
    });

    it('should handle year boundaries', () => {
      expect(addMonths('2024-12-15', 1)).toBe('2025-01-15');
      expect(addMonths('2024-01-15', -1)).toBe('2023-12-15');
    });
  });

  describe('formatDateRange', () => {
    it('should format date range in French', () => {
      const result = formatDateRange('2024-01-15', '2024-01-21');
      expect(result).toContain('15');
      expect(result).toContain('21');
      expect(result).toContain('2024');
    });
  });

  describe('formatMonth', () => {
    it('should format month and year in French', () => {
      const result = formatMonth('2024-01-15');
      expect(result).toContain('janvier');
      expect(result).toContain('2024');
    });
  });
});
