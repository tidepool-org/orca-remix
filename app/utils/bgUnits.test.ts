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
      [100, 5.6],
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
      [120, true, '2162 mg/dL'],
      [180, false, '180 mmol/L'],
      [0, true, '0 mg/dL'],
      [0, false, '0 mmol/L'],
    ])('formats %d with useMgdl=%s as %s', (value, useMgdl, expected) => {
      expect(formatBgValue(value, useMgdl)).toBe(expected);
    });

    it.each([[undefined], [null]])('returns null for %s value', (value) => {
      expect(formatBgValue(value, false)).toBeNull();
      expect(formatBgValue(value, true)).toBeNull();
    });
  });

  describe('formatInsulinSensitivity', () => {
    it.each([
      [50, true, '901 mg/dL'],
      [36, false, '36 mmol/L'],
      [100, true, '1802 mg/dL'],
      [100, false, '100 mmol/L'],
    ])(
      'formats sensitivity %d with useMgdl=%s as %s',
      (value, useMgdl, expected) => {
        expect(formatInsulinSensitivity(value, useMgdl)).toBe(expected);
      },
    );
  });

  describe('getBgUnitLabel', () => {
    it.each([
      [true, 'mg/dL'],
      [false, 'mmol/L'],
    ])('returns %s when useMgdl is %s', (useMgdl, expected) => {
      expect(getBgUnitLabel(useMgdl)).toBe(expected);
    });
  });
});
