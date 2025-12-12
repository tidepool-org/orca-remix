import { describe, it, expect } from 'vitest';
import {
  msToTime,
  msToHours,
  msToMinutes,
  timeToMs,
  hoursToMs,
  minutesToMs,
  formatDuration,
} from './timeConversion';

describe('timeConversion', () => {
  describe('msToTime', () => {
    it('converts midnight (0 ms) to 00:00', () => {
      expect(msToTime(0)).toBe('00:00');
    });

    it('converts noon (12 hours) correctly', () => {
      const noonMs = 12 * 60 * 60 * 1000;
      expect(msToTime(noonMs)).toBe('12:00');
    });

    it('converts 6:30 AM correctly', () => {
      const ms = 6 * 60 * 60 * 1000 + 30 * 60 * 1000;
      expect(msToTime(ms)).toBe('06:30');
    });

    it('converts 23:59 correctly', () => {
      const ms = 23 * 60 * 60 * 1000 + 59 * 60 * 1000;
      expect(msToTime(ms)).toBe('23:59');
    });

    it('pads single digit hours and minutes with zeros', () => {
      const ms = 1 * 60 * 60 * 1000 + 5 * 60 * 1000;
      expect(msToTime(ms)).toBe('01:05');
    });
  });

  describe('msToHours', () => {
    it('converts 1 hour in ms to 1 hour', () => {
      expect(msToHours(3600000)).toBe(1);
    });

    it('converts 90 minutes to 1.5 hours', () => {
      expect(msToHours(5400000)).toBe(1.5);
    });

    it('converts 0 ms to 0 hours', () => {
      expect(msToHours(0)).toBe(0);
    });

    it('converts 30 minutes to 0.5 hours', () => {
      expect(msToHours(1800000)).toBe(0.5);
    });
  });

  describe('msToMinutes', () => {
    it('converts 1 minute in ms to 1 minute', () => {
      expect(msToMinutes(60000)).toBe(1);
    });

    it('converts 1 hour to 60 minutes', () => {
      expect(msToMinutes(3600000)).toBe(60);
    });

    it('converts 0 ms to 0 minutes', () => {
      expect(msToMinutes(0)).toBe(0);
    });

    it('handles partial minutes', () => {
      expect(msToMinutes(90000)).toBe(1.5);
    });
  });

  describe('timeToMs', () => {
    it('converts 00:00 to 0 ms', () => {
      expect(timeToMs('00:00')).toBe(0);
    });

    it('converts 12:00 (noon) correctly', () => {
      expect(timeToMs('12:00')).toBe(12 * 60 * 60 * 1000);
    });

    it('converts 06:30 correctly', () => {
      const expected = 6 * 60 * 60 * 1000 + 30 * 60 * 1000;
      expect(timeToMs('06:30')).toBe(expected);
    });

    it('converts 23:59 correctly', () => {
      const expected = 23 * 60 * 60 * 1000 + 59 * 60 * 1000;
      expect(timeToMs('23:59')).toBe(expected);
    });
  });

  describe('hoursToMs', () => {
    it('converts 1 hour to milliseconds', () => {
      expect(hoursToMs(1)).toBe(3600000);
    });

    it('converts 0 hours to 0 ms', () => {
      expect(hoursToMs(0)).toBe(0);
    });

    it('converts fractional hours', () => {
      expect(hoursToMs(1.5)).toBe(5400000);
    });

    it('converts 24 hours correctly', () => {
      expect(hoursToMs(24)).toBe(86400000);
    });
  });

  describe('minutesToMs', () => {
    it('converts 1 minute to milliseconds', () => {
      expect(minutesToMs(1)).toBe(60000);
    });

    it('converts 0 minutes to 0 ms', () => {
      expect(minutesToMs(0)).toBe(0);
    });

    it('converts 60 minutes to 1 hour in ms', () => {
      expect(minutesToMs(60)).toBe(3600000);
    });

    it('converts fractional minutes', () => {
      expect(minutesToMs(1.5)).toBe(90000);
    });
  });

  describe('formatDuration', () => {
    it('formats hours only when no minutes', () => {
      expect(formatDuration(2 * 60 * 60 * 1000)).toBe('2h');
    });

    it('formats minutes only when less than 1 hour', () => {
      expect(formatDuration(30 * 60 * 1000)).toBe('30m');
    });

    it('formats both hours and minutes', () => {
      const ms = 2 * 60 * 60 * 1000 + 30 * 60 * 1000;
      expect(formatDuration(ms)).toBe('2h 30m');
    });

    it('handles 0 ms as 0 minutes', () => {
      expect(formatDuration(0)).toBe('0m');
    });

    it('handles 1 hour correctly', () => {
      expect(formatDuration(3600000)).toBe('1h');
    });

    it('handles 1 minute correctly', () => {
      expect(formatDuration(60000)).toBe('1m');
    });

    it('handles 1 hour 1 minute correctly', () => {
      const ms = 60 * 60 * 1000 + 60 * 1000;
      expect(formatDuration(ms)).toBe('1h 1m');
    });
  });

  describe('roundtrip conversions', () => {
    it('msToTime and timeToMs are inverses', () => {
      const originalMs = 6 * 60 * 60 * 1000 + 30 * 60 * 1000;
      const timeStr = msToTime(originalMs);
      expect(timeToMs(timeStr)).toBe(originalMs);
    });

    it('hoursToMs and msToHours are inverses', () => {
      const hours = 5.5;
      expect(msToHours(hoursToMs(hours))).toBe(hours);
    });

    it('minutesToMs and msToMinutes are inverses', () => {
      const minutes = 90;
      expect(msToMinutes(minutesToMs(minutes))).toBe(minutes);
    });
  });
});
