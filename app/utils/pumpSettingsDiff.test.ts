import { describe, it, expect } from 'vitest';
import {
  diffEntries,
  getCategorySchedules,
  buildSettingsChanges,
} from './pumpSettingsDiff';
import type { PumpSettings } from '~/components/User/types';

const ps = (overrides: Partial<PumpSettings>): PumpSettings => ({
  id: 'ps',
  type: 'pumpSettings',
  time: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('pumpSettingsDiff', () => {
  describe('diffEntries', () => {
    it('classifies a changed row by matching start, with per-key from/to', () => {
      const rows = diffEntries(
        [{ start: 0, rate: 0.85 }],
        [{ start: 0, rate: 0.8 }],
        ['rate'],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe('changed');
      expect(rows[0].changes.rate).toEqual({ from: 0.8, to: 0.85 });
    });

    it('marks entries present only in curr as added, only in prev as removed', () => {
      const added = diffEntries([{ start: 0, rate: 1 }], [], ['rate']);
      expect(added[0].status).toBe('added');

      const removed = diffEntries([], [{ start: 0, rate: 1 }], ['rate']);
      expect(removed[0].status).toBe('removed');
      // Removed rows still carry the prev entry so the UI can render them.
      expect(removed[0].entry).toEqual({ start: 0, rate: 1 });
    });

    it('reports identical entries as same with no changes', () => {
      const rows = diffEntries(
        [{ start: 0, rate: 1 }],
        [{ start: 0, rate: 1 }],
        ['rate'],
      );
      expect(rows[0].status).toBe('same');
      expect(rows[0].changes).toEqual({});
    });

    it('unions starts from both sides, sorted ascending', () => {
      const rows = diffEntries(
        [{ start: 360, rate: 1 }],
        [{ start: 0, rate: 1 }],
        ['rate'],
      );
      expect(rows.map((r) => r.start)).toEqual([0, 360]);
      expect(rows[0].status).toBe('removed');
      expect(rows[1].status).toBe('added');
    });

    it('tracks only the differing key across a multi-key category', () => {
      const rows = diffEntries(
        [{ start: 0, target: 105, low: 95, high: 120 }],
        [{ start: 0, target: 110, low: 95, high: 120 }],
        ['target', 'low', 'high'],
      );
      expect(rows[0].status).toBe('changed');
      expect(Object.keys(rows[0].changes)).toEqual(['target']);
      expect(rows[0].changes.target).toEqual({ from: 110, to: 105 });
    });

    it('does not mutate its inputs', () => {
      const curr = [{ start: 0, rate: 1 }];
      const prev = [{ start: 0, rate: 2 }];
      diffEntries(curr, prev, ['rate']);
      expect(curr).toEqual([{ start: 0, rate: 1 }]);
      expect(prev).toEqual([{ start: 0, rate: 2 }]);
    });
  });

  describe('getCategorySchedules', () => {
    it('returns the plural schedule map directly', () => {
      const settings = ps({
        basalSchedules: { Weekday: [{ start: 0, rate: 1 }] },
      });
      expect(getCategorySchedules(settings, 'basal')).toEqual({
        Weekday: [{ start: 0, rate: 1 }],
      });
    });

    it("collapses a singular bgTarget array into a 'Default' schedule", () => {
      const settings = ps({ bgTarget: [{ start: 0, target: 100 }] });
      expect(getCategorySchedules(settings, 'bgTargets')).toEqual({
        Default: [{ start: 0, target: 100 }],
      });
    });

    it('returns an empty map when the category is absent', () => {
      expect(getCategorySchedules(ps({}), 'carbRatios')).toEqual({});
    });
  });

  describe('buildSettingsChanges', () => {
    it('returns no changes for identical snapshots', () => {
      const settings = ps({
        basalSchedules: { Weekday: [{ start: 0, rate: 1 }] },
      });
      expect(buildSettingsChanges(settings, { ...settings })).toEqual([]);
    });

    it('surfaces a schedule present in only one snapshot', () => {
      const curr = ps({
        basalSchedules: {
          Weekday: [{ start: 0, rate: 1 }],
          Weekend: [{ start: 0, rate: 0.9 }],
        },
      });
      const prev = ps({
        basalSchedules: { Weekday: [{ start: 0, rate: 1 }] },
      });
      const changes = buildSettingsChanges(curr, prev);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        category: 'basal',
        schedule: 'Weekend',
        status: 'added',
      });
    });

    it('detects a range change (target + range devices)', () => {
      const curr = ps({ bgTarget: [{ start: 0, target: 100, range: 10 }] });
      const prev = ps({ bgTarget: [{ start: 0, target: 100, range: 20 }] });
      const changes = buildSettingsChanges(curr, prev);
      expect(changes).toHaveLength(1);
      expect(changes[0].status).toBe('changed');
      expect(changes[0].changes.range).toEqual({ from: 20, to: 10 });
    });

    it('detects a high change on target + high devices', () => {
      const curr = ps({ bgTarget: [{ start: 0, target: 110, high: 130 }] });
      const prev = ps({ bgTarget: [{ start: 0, target: 110, high: 120 }] });
      const changes = buildSettingsChanges(curr, prev);
      expect(changes).toHaveLength(1);
      expect(changes[0].changes.high).toEqual({ from: 120, to: 130 });
    });

    it('diffs singular-field snapshots under the Default schedule', () => {
      const curr = ps({ bgTarget: [{ start: 0, target: 105 }] });
      const prev = ps({ bgTarget: [{ start: 0, target: 110 }] });
      const changes = buildSettingsChanges(curr, prev);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        category: 'bgTargets',
        schedule: 'Default',
        status: 'changed',
      });
      expect(changes[0].changes.target).toEqual({ from: 110, to: 105 });
    });
  });
});
