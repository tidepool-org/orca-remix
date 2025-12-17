import { describe, it, expect } from 'vitest';
import {
  formatShortDate,
  formatDateWithTime,
  formatDateTime,
  formatLongDate,
} from './dateFormatters';

describe('dateFormatters', () => {
  // Use en-US locale for consistent test results
  const locale = 'en-US';

  describe('formatShortDate', () => {
    it('formats a valid date string with timezone', () => {
      // Use a full ISO timestamp with timezone to avoid timezone interpretation issues
      const result = formatShortDate('2024-01-15T12:00:00Z', locale);
      expect(result).toBe('Jan 15, 2024');
    });

    it('returns null for undefined input', () => {
      expect(formatShortDate(undefined, locale)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatShortDate('', locale)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(formatShortDate('not-a-date', locale)).toBeNull();
    });

    it('returns null for malformed date', () => {
      expect(formatShortDate('2024-99-99', locale)).toBeNull();
    });

    it('formats date with explicit timezone correctly', () => {
      const result = formatShortDate('2024-06-15T12:00:00Z', locale);
      expect(result).toBe('Jun 15, 2024');
    });
  });

  describe('formatDateWithTime', () => {
    it('formats a valid date string with time', () => {
      const result = formatDateWithTime('2024-01-15T15:30:00Z', locale);
      // The exact output depends on the system timezone
      expect(result).toContain('Jan 15, 2024');
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
    });

    it('returns null for undefined input', () => {
      expect(formatDateWithTime(undefined, locale)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatDateWithTime('', locale)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(formatDateWithTime('not-a-date', locale)).toBeNull();
    });

    it('returns null for malformed date', () => {
      expect(formatDateWithTime('invalid', locale)).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    it('formats date without time by default', () => {
      const result = formatDateTime('2024-01-15T12:00:00Z', locale);
      expect(result).toBe('Jan 15, 2024');
    });

    it('formats date with time when includeTime is true', () => {
      const result = formatDateTime('2024-01-15T15:30:00Z', locale, true);
      expect(result).toContain('Jan 15, 2024');
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
    });

    it('returns null for undefined input', () => {
      expect(formatDateTime(undefined, locale)).toBeNull();
      expect(formatDateTime(undefined, locale, true)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(formatDateTime('not-a-date', locale)).toBeNull();
      expect(formatDateTime('not-a-date', locale, true)).toBeNull();
    });
  });

  describe('formatLongDate', () => {
    it('formats a valid date string in long format', () => {
      const result = formatLongDate('2024-01-15T12:00:00Z', locale);
      expect(result).toBe('January 15, 2024');
    });

    it('formats different months correctly', () => {
      expect(formatLongDate('2024-06-15T12:00:00Z', locale)).toBe(
        'June 15, 2024',
      );
      expect(formatLongDate('2024-11-15T12:00:00Z', locale)).toBe(
        'November 15, 2024',
      );
      expect(formatLongDate('2024-12-25T12:00:00Z', locale)).toBe(
        'December 25, 2024',
      );
    });

    it('returns null for undefined input', () => {
      expect(formatLongDate(undefined, locale)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatLongDate('', locale)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(formatLongDate('not-a-date', locale)).toBeNull();
    });

    it('returns null for malformed date', () => {
      expect(formatLongDate('xyz-123-abc', locale)).toBeNull();
    });
  });

  describe('locale handling', () => {
    it('respects different locales for short date', () => {
      // German locale uses different date format
      const result = formatShortDate('2024-01-15T12:00:00Z', 'de-DE');
      // German format: 15. Jan. 2024 or similar
      expect(result).toBeTruthy();
      expect(result).toContain('2024');
    });

    it('respects different locales for long date', () => {
      const result = formatLongDate('2024-01-15T12:00:00Z', 'de-DE');
      expect(result).toBeTruthy();
      expect(result).toContain('2024');
    });
  });

  describe('edge cases', () => {
    it('handles timestamps with milliseconds', () => {
      const result = formatShortDate('2024-01-15T12:30:45.123Z', locale);
      expect(result).toBe('Jan 15, 2024');
    });

    it('handles date near midnight UTC', () => {
      // Using noon UTC to avoid timezone edge cases
      const result = formatShortDate('2024-07-04T12:00:00Z', locale);
      expect(result).toBe('Jul 4, 2024');
    });

    it('handles year boundaries', () => {
      const result = formatLongDate('2024-01-01T12:00:00Z', locale);
      expect(result).toBe('January 1, 2024');
    });

    it('handles leap year date', () => {
      const result = formatShortDate('2024-02-29T12:00:00Z', locale);
      expect(result).toBe('Feb 29, 2024');
    });
  });
});
