import { describe, it, expect } from 'vitest';
import {
  mgdlToMmol,
  mmolToMgdl,
  formatBgValue,
  formatInsulinSensitivity,
  getBgUnitLabel,
} from './bgUnits';

describe('bgUnits', () => {
  describe('mgdlToMmol', () => {
    it('converts 100 mg/dL to mmol/L correctly', () => {
      // 100 / 18.0182 = 5.5509..., rounds to 5.5
      expect(mgdlToMmol(100)).toBe(5.5);
    });

    it('converts 180 mg/dL to mmol/L correctly', () => {
      expect(mgdlToMmol(180)).toBe(10);
    });

    it('converts 70 mg/dL to mmol/L correctly', () => {
      expect(mgdlToMmol(70)).toBe(3.9);
    });

    it('converts 0 mg/dL to 0 mmol/L', () => {
      expect(mgdlToMmol(0)).toBe(0);
    });

    it('rounds to 1 decimal place', () => {
      // 125 mg/dL = 6.938... mmol/L, should round to 6.9
      expect(mgdlToMmol(125)).toBe(6.9);
    });
  });

  describe('mmolToMgdl', () => {
    it('converts 5.5 mmol/L to mg/dL correctly', () => {
      expect(mmolToMgdl(5.5)).toBe(99);
    });

    it('converts 10 mmol/L to mg/dL correctly', () => {
      expect(mmolToMgdl(10)).toBe(180);
    });

    it('converts 4 mmol/L to mg/dL correctly', () => {
      expect(mmolToMgdl(4)).toBe(72);
    });

    it('converts 0 mmol/L to 0 mg/dL', () => {
      expect(mmolToMgdl(0)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      // 5.6 mmol/L = 100.9... mg/dL, should round to 101
      expect(mmolToMgdl(5.6)).toBe(101);
    });
  });

  describe('formatBgValue', () => {
    it('formats mg/dL value correctly when useMmol is false', () => {
      expect(formatBgValue(120, false)).toBe('120 mg/dL');
    });

    it('formats mmol/L value correctly when useMmol is true', () => {
      expect(formatBgValue(180, true)).toBe('10 mmol/L');
    });

    it('returns null for undefined value', () => {
      expect(formatBgValue(undefined, false)).toBeNull();
    });

    it('returns null for null value', () => {
      expect(formatBgValue(null, true)).toBeNull();
    });

    it('handles zero value correctly', () => {
      expect(formatBgValue(0, false)).toBe('0 mg/dL');
      expect(formatBgValue(0, true)).toBe('0 mmol/L');
    });
  });

  describe('formatInsulinSensitivity', () => {
    it('formats mg/dL sensitivity correctly when useMmol is false', () => {
      expect(formatInsulinSensitivity(50, false)).toBe('50 mg/dL');
    });

    it('formats mmol/L sensitivity correctly when useMmol is true', () => {
      expect(formatInsulinSensitivity(36, true)).toBe('2 mmol/L');
    });

    it('handles large values', () => {
      expect(formatInsulinSensitivity(100, false)).toBe('100 mg/dL');
      // 100 / 18.0182 = 5.5509..., rounds to 5.5
      expect(formatInsulinSensitivity(100, true)).toBe('5.5 mmol/L');
    });
  });

  describe('getBgUnitLabel', () => {
    it('returns mg/dL when useMmol is false', () => {
      expect(getBgUnitLabel(false)).toBe('mg/dL');
    });

    it('returns mmol/L when useMmol is true', () => {
      expect(getBgUnitLabel(true)).toBe('mmol/L');
    });
  });
});
