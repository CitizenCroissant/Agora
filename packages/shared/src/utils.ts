/**
 * Utility functions shared across apps
 */

/**
 * Format a date string to French locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a time string (HH:MM:SS) to HH:MM
 */
export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

/**
 * Format a time range for display
 */
export function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime && !endTime) return '';
  if (!endTime) return formatTime(startTime);
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Subtract days from a date
 */
export function subtractDays(dateString: string, days: number): string {
  return addDays(dateString, -days);
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

/**
 * Get a date range for queries
 */
export function getDateRange(centerDate: string, daysBefore: number, daysAfter: number): { from: string; to: string } {
  return {
    from: subtractDays(centerDate, daysBefore),
    to: addDays(centerDate, daysAfter),
  };
}
