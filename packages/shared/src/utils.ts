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

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(dateString: string): string {
  const weekStart = getWeekStart(dateString);
  return addDays(weekStart, 6);
}

/**
 * Get the start of the month for a given date
 */
export function getMonthStart(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Get the end of the month for a given date
 */
export function getMonthEnd(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Add weeks to a date
 */
export function addWeeks(dateString: string, weeks: number): string {
  return addDays(dateString, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(dateString: string, months: number): string {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Format a date range for display
 */
export function formatDateRange(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  const fromFormatted = fromDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  
  const toFormatted = toDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  return `${fromFormatted} - ${toFormatted}`;
}

/**
 * Format a month for display
 */
export function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}
