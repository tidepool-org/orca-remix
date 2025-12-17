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
    it.each([
      [100, 5.5],
      [180, 10],
      [70, 3.9],
      [0, 0],
      [125, 6.9], // Tests rounding to 1 decimal place
    ])('converts %d mg/dL to %s mmol/L', (mgdl, expected) => {
      expect(mgdlToMmol(mgdl)).toBe(expected);
    });
  });

  describe('mmolToMgdl', () => {
    it.each([
      [5.5, 99],
      [10, 180],
      [4, 72],
      [0, 0],
      [5.6, 101], // Tests rounding to nearest integer
    ])('converts %s mmol/L to %d mg/dL', (mmol, expected) => {
      expect(mmolToMgdl(mmol)).toBe(expected);
    });
  });

  describe('formatBgValue', () => {
    it.each([
      [120, false, '120 mg/dL'],
      [180, true, '10 mmol/L'],
      [0, false, '0 mg/dL'],
      [0, true, '0 mmol/L'],
    ])('formats %d with useMmol=%s as %s', (value, useMmol, expected) => {
      expect(formatBgValue(value, useMmol)).toBe(expected);
    });

    it.each([[undefined], [null]])('returns null for %s value', (value) => {
      expect(formatBgValue(value, false)).toBeNull();
      expect(formatBgValue(value, true)).toBeNull();
    });
  });

  describe('formatInsulinSensitivity', () => {
    it.each([
      [50, false, '50 mg/dL'],
      [36, true, '2 mmol/L'],
      [100, false, '100 mg/dL'],
      [100, true, '5.5 mmol/L'],
    ])(
      'formats sensitivity %d with useMmol=%s as %s',
      (value, useMmol, expected) => {
        expect(formatInsulinSensitivity(value, useMmol)).toBe(expected);
      },
    );
  });

  describe('getBgUnitLabel', () => {
    it.each([
      [false, 'mg/dL'],
      [true, 'mmol/L'],
    ])('returns %s when useMmol is %s', (useMmol, expected) => {
      expect(getBgUnitLabel(useMmol)).toBe(expected);
    });
  });
});
