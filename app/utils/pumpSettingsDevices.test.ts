import { describe, it, expect } from 'vitest';
import {
  groupPumpSettingsByDevice,
  countDistinctDevices,
  getVersionRange,
} from './pumpSettingsDevices';
import type { PumpSettings } from '~/components/User/types';

const ps = (overrides: Partial<PumpSettings>): PumpSettings => ({
  id: 'ps',
  type: 'pumpSettings',
  time: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('pumpSettingsDevices', () => {
  describe('groupPumpSettingsByDevice', () => {
    it('groups by deviceId, sorting versions newest-first', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ id: 'a1', deviceId: 'A', time: '2026-01-01T00:00:00Z' }),
        ps({ id: 'a2', deviceId: 'A', time: '2026-03-01T00:00:00Z' }),
        ps({ id: 'b1', deviceId: 'B', time: '2026-02-01T00:00:00Z' }),
      ]);
      expect(groups).toHaveLength(2);
      const a = groups.find((g) => g.key === 'A');
      expect(a?.versions.map((v) => v.id)).toEqual(['a2', 'a1']);
    });

    it('falls back to serialNumber, then unknown', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ id: 's1', serialNumber: 'SN-1' }),
        ps({ id: 'u1' }),
      ]);
      expect(groups.map((g) => g.key).sort()).toEqual(['SN-1', 'unknown']);
    });

    it('keys identifier-less devices by service id so they do not collide', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ id: 'loop', origin: { name: 'org.tidepool.Loop' } }),
        ps({ id: 'trio', client: { name: 'org.nightscout.Trio' } }),
      ]);
      expect(groups.map((g) => g.key).sort()).toEqual([
        'org.nightscout.Trio',
        'org.tidepool.Loop',
      ]);
    });

    it('collapses same-UTC-day snapshots to the latest, per device', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ id: 'early', deviceId: 'A', time: '2026-03-01T02:00:00Z' }),
        ps({ id: 'late', deviceId: 'A', time: '2026-03-01T20:00:00Z' }),
        ps({ id: 'nextDay', deviceId: 'A', time: '2026-03-02T05:00:00Z' }),
      ]);
      const a = groups.find((g) => g.key === 'A');
      // Two distinct days survive; the same-day duplicate collapses to the
      // later timestamp.
      expect(a?.versions.map((v) => v.id)).toEqual(['nextDay', 'late']);
    });

    it('collapses same-day per device, not across devices', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ id: 'a1', deviceId: 'A', time: '2026-03-01T02:00:00Z' }),
        ps({ id: 'a2', deviceId: 'A', time: '2026-03-01T20:00:00Z' }),
        ps({ id: 'b1', deviceId: 'B', time: '2026-03-01T09:00:00Z' }),
      ]);
      expect(groups.find((g) => g.key === 'A')?.versions).toHaveLength(1);
      expect(groups.find((g) => g.key === 'B')?.versions).toHaveLength(1);
    });

    it('marks only the group holding the globally-newest snapshot active', () => {
      const groups = groupPumpSettingsByDevice([
        ps({ deviceId: 'A', time: '2026-01-01T00:00:00Z' }),
        ps({ deviceId: 'B', time: '2026-06-01T00:00:00Z' }),
      ]);
      const active = groups.filter((g) => g.active);
      expect(active).toHaveLength(1);
      expect(active[0].key).toBe('B');
      // Groups are newest-first too.
      expect(groups[0].key).toBe('B');
    });
  });

  describe('countDistinctDevices', () => {
    it('counts distinct devices: empty ⇒ 0, single ⇒ 1, mixed ⇒ n', () => {
      expect(countDistinctDevices([])).toBe(0);
      expect(
        countDistinctDevices([
          ps({ deviceId: 'A', time: '2026-01-01T00:00:00Z' }),
          ps({ deviceId: 'A', time: '2026-02-01T00:00:00Z' }),
        ]),
      ).toBe(1);
      expect(
        countDistinctDevices([
          ps({ deviceId: 'A' }),
          ps({ deviceId: 'B' }),
          ps({ deviceId: 'A' }),
        ]),
      ).toBe(2);
    });
  });

  describe('getVersionRange', () => {
    it('gives a null end for the newest version and the next-newer time otherwise', () => {
      const versions = [
        ps({ id: 'v0', time: '2026-03-01T00:00:00Z' }),
        ps({ id: 'v1', time: '2026-01-01T00:00:00Z' }),
      ];
      expect(getVersionRange(versions, 0)).toEqual({
        start: '2026-03-01T00:00:00Z',
        end: null,
      });
      expect(getVersionRange(versions, 1)).toEqual({
        start: '2026-01-01T00:00:00Z',
        end: '2026-03-01T00:00:00Z',
      });
    });
  });
});
