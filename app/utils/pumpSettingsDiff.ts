// Pure, dependency-free diff engine for pump-settings snapshots. Compares two
// PumpSettings records and classifies each schedule row as same / changed /
// added / removed.

import type {
  PumpSettings,
  BasalScheduleEntry,
  BGTargetEntry,
  CarbRatioEntry,
  InsulinSensitivityEntry,
} from '~/components/User/types';

export type RowStatus = 'same' | 'changed' | 'added' | 'removed';

export type ScheduleEntry =
  | BasalScheduleEntry
  | BGTargetEntry
  | CarbRatioEntry
  | InsulinSensitivityEntry;

export type SettingsCategory =
  | 'basal'
  | 'bgTargets'
  | 'carbRatios'
  | 'insulinSensitivity';

// Which numeric fields define a "change" for each category. BG targets carry a
// device-dependent subset of target/low/high/range; all
// four are diffed, and the UI renders only the fields actually present.
export const CATEGORY_KEYS: Record<SettingsCategory, string[]> = {
  basal: ['rate'],
  bgTargets: ['target', 'low', 'high', 'range'],
  carbRatios: ['amount'],
  insulinSensitivity: ['amount'],
};

export type EntryChange<T> = { from: T[keyof T]; to: T[keyof T] };

export type EntryDiff<T> = {
  start: number;
  status: RowStatus;
  entry: T;
  changes: Partial<Record<keyof T, EntryChange<T>>>;
};

/**
 * Diff two lists of schedule entries, matching by `start` (ms from midnight).
 * Union of starts is returned sorted ascending. An entry present only in
 * `curr` is `added`, only in `prev` is `removed`; matched entries are
 * `changed` (with a per-key `{ from, to }`) when any tracked key differs, else
 * `same`.
 */
export function diffEntries<T extends { start: number }>(
  curr: T[] = [],
  prev: T[] = [],
  keys: (keyof T)[],
): EntryDiff<T>[] {
  const currByStart = new Map<number, T>(
    curr.map((entry) => [entry.start, entry]),
  );
  const prevByStart = new Map<number, T>(
    prev.map((entry) => [entry.start, entry]),
  );
  const allStarts = [
    ...new Set([...curr, ...prev].map((entry) => entry.start)),
  ].sort((a, b) => a - b);

  return allStarts.map((start) => {
    const currEntry = currByStart.get(start);
    const prevEntry = prevByStart.get(start);
    if (currEntry && !prevEntry) {
      return { start, status: 'added', entry: currEntry, changes: {} };
    }
    if (!currEntry && prevEntry) {
      return { start, status: 'removed', entry: prevEntry, changes: {} };
    }

    const changes: Partial<Record<keyof T, EntryChange<T>>> = {};
    let hasChange = false;
    for (const key of keys) {
      if (currEntry![key] !== prevEntry![key]) {
        hasChange = true;
        changes[key] = { from: prevEntry![key], to: currEntry![key] };
      }
    }
    return {
      start,
      status: hasChange ? 'changed' : 'same',
      entry: currEntry!,
      changes,
    };
  });
}

/**
 * Normalize a PumpSettings record into `Record<scheduleName, entry[]>` for one
 * category. Handles ORCA's singular fallbacks (`bgTarget` / `carbRatio` /
 * `insulinSensitivity`), which collapse into a single `'Default'` schedule.
 */
export function getCategorySchedules(
  settings: PumpSettings,
  category: SettingsCategory,
): Record<string, ScheduleEntry[]> {
  switch (category) {
    case 'basal':
      return settings.basalSchedules ?? {};
    case 'bgTargets':
      if (settings.bgTargets) return settings.bgTargets;
      return settings.bgTarget ? { Default: settings.bgTarget } : {};
    case 'carbRatios':
      if (settings.carbRatios) return settings.carbRatios;
      return settings.carbRatio ? { Default: settings.carbRatio } : {};
    case 'insulinSensitivity':
      if (settings.insulinSensitivities) return settings.insulinSensitivities;
      return settings.insulinSensitivity
        ? { Default: settings.insulinSensitivity }
        : {};
  }
}

export type SettingsChange = {
  category: SettingsCategory;
  schedule: string;
  start: number;
  status: Exclude<RowStatus, 'same'>;
  entry: ScheduleEntry;
  changes: Partial<Record<string, EntryChange<ScheduleEntry>>>;
};

/**
 * Build a flat list of every non-`same` row change between two snapshots,
 * across all categories and schedules. Schedule names are unioned from BOTH
 * snapshots so a schedule present on only one side still contributes
 * added/removed rows. Powers the change-summary banner and the "N changes"
 * count. Inputs are never mutated.
 */
export function buildSettingsChanges(
  curr: PumpSettings,
  prev: PumpSettings,
): SettingsChange[] {
  const changes: SettingsChange[] = [];

  for (const category of Object.keys(CATEGORY_KEYS) as SettingsCategory[]) {
    const keys = CATEGORY_KEYS[category];
    const currSchedules = getCategorySchedules(curr, category);
    const prevSchedules = getCategorySchedules(prev, category);
    const scheduleNames = [
      ...new Set([
        ...Object.keys(currSchedules),
        ...Object.keys(prevSchedules),
      ]),
    ];

    for (const schedule of scheduleNames) {
      const diffs = diffEntries(
        currSchedules[schedule],
        prevSchedules[schedule],
        keys as (keyof ScheduleEntry)[],
      );
      for (const diff of diffs) {
        if (diff.status === 'same') continue;
        changes.push({
          category,
          schedule,
          start: diff.start,
          status: diff.status,
          entry: diff.entry,
          changes: diff.changes,
        });
      }
    }
  }

  return changes;
}
