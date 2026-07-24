// Pure client-side transform that turns a flat PumpSettings[] into the
// two-level device → version hierarchy the Device tab renders, plus the
// distinct-device count used by the tab badge. No data is fetched, no friendly
// display names are resolved here (that stays in the component), no inputs are
// mutated.

import type { PumpSettings } from '~/components/User/types';

export type DeviceGroup = {
  key: string; // deviceId ?? serialNumber ?? 'unknown'
  active: boolean; // true for the group holding the globally-newest snapshot
  versions: PumpSettings[]; // newest first (sorted by time descending)
};

// Include platform service ids (origin/client name) before the final fallback
// so two identifier-less app devices (e.g. Loop vs Trio) don't collapse into a
// single 'unknown' group and get diffed against each other.
const deviceKey = (settings: PumpSettings): string =>
  settings.deviceId ??
  settings.serialNumber ??
  settings.origin?.name ??
  settings.client?.name ??
  'unknown';

const toMillis = (time: string): number => new Date(time).getTime();

// UTC calendar day (YYYY-MM-DD) for a snapshot — matches how ORCA renders
// these dates (formatShortDate uses timeZone: 'UTC').
const utcDay = (time: string): string =>
  new Date(time).toISOString().slice(0, 10);

/**
 * Collapse same-day snapshots to the day's final (latest) entry. Expects a
 * newest-first list, so the first snapshot seen per UTC day is that day's
 * latest. Mirrors blip's settings view, which shows only the final settings
 * when multiple changes were made on the same day.
 */
const collapseSameDay = (
  versionsNewestFirst: PumpSettings[],
): PumpSettings[] => {
  const seenDays = new Set<string>();
  const collapsed: PumpSettings[] = [];
  for (const version of versionsNewestFirst) {
    const day = utcDay(version.time);
    if (seenDays.has(day)) continue;
    seenDays.add(day);
    collapsed.push(version);
  }
  return collapsed;
};

/**
 * Group snapshots by `deviceId ?? serialNumber ?? 'unknown'`. Each group's
 * versions are sorted newest-first and collapsed to one per UTC calendar day
 * (the day's latest); groups are sorted by their newest snapshot's time
 * descending. Exactly the first group — the one holding the globally-newest
 * snapshot — is marked `active`. Inputs are not mutated.
 */
export function groupPumpSettingsByDevice(
  pumpSettings: PumpSettings[],
): DeviceGroup[] {
  const byKey = new Map<string, PumpSettings[]>();
  for (const settings of pumpSettings) {
    const key = deviceKey(settings);
    const existing = byKey.get(key);
    if (existing) {
      existing.push(settings);
    } else {
      byKey.set(key, [settings]);
    }
  }

  const groups: DeviceGroup[] = [...byKey.entries()].map(([key, versions]) => ({
    key,
    active: false,
    versions: collapseSameDay(
      [...versions].sort((a, b) => toMillis(b.time) - toMillis(a.time)),
    ),
  }));

  groups.sort(
    (a, b) => toMillis(b.versions[0].time) - toMillis(a.versions[0].time),
  );

  if (groups.length > 0) groups[0].active = true;

  return groups;
}

/**
 * Number of distinct devices — the group count. A single-device array is 1;
 * an empty array is 0. Consumed by both Device-tab call-sites.
 */
export function countDistinctDevices(pumpSettings: PumpSettings[]): number {
  return groupPumpSettingsByDevice(pumpSettings).length;
}

/**
 * Effective date range for the version at `index` (0 = newest) within a
 * device's newest-first version list. `start` is that version's time; `end` is
 * the next-newer version's time, or `null` for the newest version (render as
 * "present"). Formatting/locale is the component's job.
 */
export function getVersionRange(
  versions: PumpSettings[],
  index: number,
): { start: string; end: string | null } {
  return {
    start: versions[index].time,
    end: index === 0 ? null : versions[index - 1].time,
  };
}
