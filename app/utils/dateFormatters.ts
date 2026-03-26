import { intlFormat } from 'date-fns';

/**
 * Safely parse a date string and return null if invalid
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date string in short format (e.g., "Jan 15, 2024")
 * Renders in UTC to avoid timezone-related date shifts for date-only displays.
 */
export function formatShortDate(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  try {
    return intlFormat(
      date,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      },
      { locale },
    );
  } catch {
    return null;
  }
}

/**
 * Formats a date string with time (e.g., "Jan 15, 2024, 3:45 PM")
 */
export function formatDateWithTime(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  try {
    return intlFormat(
      date,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
      { locale },
    );
  } catch {
    return null;
  }
}

/**
 * Formats a date string with optional time
 */
export function formatDateTime(
  dateStr: string | undefined,
  locale: string,
  includeTime = false,
): string | null {
  return includeTime
    ? formatDateWithTime(dateStr, locale)
    : formatShortDate(dateStr, locale);
}

/**
 * Formats a date string to show only the time (e.g., "3:45 PM")
 */
export function formatTimeOnly(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  try {
    return intlFormat(
      date,
      {
        hour: 'numeric',
        minute: 'numeric',
      },
      { locale },
    );
  } catch {
    return null;
  }
}

/**
 * Formats a date-only string (e.g., "January 15, 2024")
 * Renders in UTC to avoid timezone-related date shifts for date-only displays.
 */
export function formatLongDate(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  try {
    return intlFormat(
      date,
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      },
      { locale },
    );
  } catch {
    return null;
  }
}
