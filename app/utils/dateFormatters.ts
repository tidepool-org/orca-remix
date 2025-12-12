import { intlFormat } from 'date-fns';

/**
 * Formats a date string in short format (e.g., "Jan 15, 2024")
 */
export function formatShortDate(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  return intlFormat(
    new Date(dateStr),
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    { locale },
  );
}

/**
 * Formats a date string with time (e.g., "Jan 15, 2024, 3:45 PM")
 */
export function formatDateWithTime(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  return intlFormat(
    new Date(dateStr),
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
    { locale },
  );
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
 * Formats a date-only string (e.g., "January 15, 2024")
 */
export function formatLongDate(
  dateStr: string | undefined,
  locale: string,
): string | null {
  if (!dateStr) return null;
  return intlFormat(
    new Date(dateStr),
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    { locale },
  );
}
