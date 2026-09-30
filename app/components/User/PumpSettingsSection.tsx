import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Chip,
  Spinner,
  Switch,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Settings, Clock, Target, Utensils, Zap } from 'lucide-react';
import { formatDateWithTime, formatShortDate } from '~/utils/dateFormatters';
import { msToTime } from '~/utils/timeConversion';
import { formatBgValue, formatInsulinSensitivity } from '~/utils/bgUnits';
import {
  getFriendlyDeviceName,
  getPlatformDeviceLabel,
} from '~/utils/deviceNames';
import {
  groupPumpSettingsByDevice,
  getVersionRange,
} from '~/utils/pumpSettingsDevices';
import {
  diffEntries,
  getCategorySchedules,
  buildSettingsChanges,
  type RowStatus,
  type EntryDiff,
} from '~/utils/pumpSettingsDiff';
import useLocale from '~/hooks/useLocale';
import { usePumpSettingsCompare } from '~/contexts/PumpSettingsCompareContext';
import SectionPanel from '~/components/ui/SectionPanel';
import ProfileTabs from '~/components/ui/ProfileTabs';
import ResourceError from '~/components/ui/ResourceError';
import DeviceSelector, { type DeviceDisplay } from './DeviceSelector';
import SettingsVersionSelector, {
  type VersionDisplay,
} from './SettingsVersionSelector';
import PumpSettingsDiffSummary from './PumpSettingsDiffSummary';
import type {
  PumpSettings,
  BasalScheduleEntry,
  BGTargetEntry,
  CarbRatioEntry,
  InsulinSensitivityEntry,
} from './types';
import type { ResourceState } from '~/api.types';

export type PumpSettingsSectionProps = {
  pumpSettings: PumpSettings[];
  pumpSettingsState?: ResourceState<PumpSettings[]>;
  isLoading?: boolean;
  preferredBgUnits?: 'mg/dL' | 'mmol/L';
};

// Per-row diff accents mapped to ORCA's theme tokens (warning / success /
// danger) so they track light and dark automatically.
const cellBgClass = (status: RowStatus): string => {
  switch (status) {
    case 'changed':
      return 'bg-[color-mix(in_srgb,var(--warn-bg)_60%,transparent)]';
    case 'added':
      return 'bg-[color-mix(in_srgb,var(--ok)_9%,transparent)]';
    case 'removed':
      return 'bg-[color-mix(in_srgb,var(--danger-soft)_55%,transparent)] text-[color:var(--text-faint)] line-through';
    default:
      return '';
  }
};

const cellAccentClass = (status: RowStatus): string => {
  switch (status) {
    case 'changed':
      return 'shadow-[inset_3px_0_var(--warn)]';
    case 'added':
      return 'shadow-[inset_3px_0_var(--ok)]';
    case 'removed':
      return 'shadow-[inset_3px_0_var(--danger)]';
    default:
      return '';
  }
};

const RowTag = ({ status }: { status: RowStatus }) => {
  if (status === 'added') {
    return (
      <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-[color:var(--ok)]">
        Added
      </span>
    );
  }
  if (status === 'removed') {
    return (
      <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[color:var(--danger-soft)] text-[color:var(--danger-soft-fg)]">
        Removed
      </span>
    );
  }
  return null;
};

// BG-target fields in display order. Devices use a subset (see viz pump
// schemas: target; target+range; target+high; low+high) — only the fields
// present in the data are rendered.
const BG_TARGET_COLUMNS: { key: keyof BGTargetEntry; header: string }[] = [
  { key: 'target', header: 'Target' },
  { key: 'low', header: 'Low' },
  { key: 'high', header: 'High' },
  { key: 'range', header: 'Range' },
];

// The BG-target columns actually present across a schedule's rows (falls back
// to Target so an unexpected empty schedule still renders a value column).
const presentBgColumns = (rows: EntryDiff<BGTargetEntry>[]) => {
  const present = BG_TARGET_COLUMNS.filter((col) =>
    rows.some(
      (row) => row.entry[col.key] != null || row.changes[col.key] !== undefined,
    ),
  );
  return present.length > 0 ? present : [BG_TARGET_COLUMNS[0]];
};

// Render one value cell — an `old → new` pair for a changed key, else the
// plain formatted value.
function renderValueCell<T extends { start: number }>(
  row: EntryDiff<T>,
  key: keyof T & string,
  fmt: (v: number | undefined) => string,
) {
  const change = row.changes[key];
  if (change) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[color:var(--text-faint)] line-through">
          {fmt(change.from as number | undefined)}
        </span>
        <span className="text-[color:var(--text-faint)]">→</span>
        <span className="font-semibold">
          {fmt(change.to as number | undefined)}
        </span>
      </span>
    );
  }
  return fmt(row.entry[key] as number | undefined);
}

// Build diff rows for a schedule, or plain same-rows when not comparing.
const toDiffRows = <T extends { start: number }>(
  curr: T[] | undefined,
  prev: T[] | undefined,
  keys: (keyof T)[],
  comparing: boolean,
): EntryDiff<T>[] => {
  if (!comparing) {
    return [...(curr ?? [])]
      .sort((a, b) => a.start - b.start)
      .map((entry) => ({
        start: entry.start,
        status: 'same',
        entry,
        changes: {},
      }));
  }
  // Comparing: normalize both sides to arrays so a schedule present on only one
  // snapshot still diffs as wholly added or removed.
  return diffEntries(curr ?? [], prev ?? [], keys);
};

export default function PumpSettingsSection({
  pumpSettings = [],
  pumpSettingsState,
  isLoading = false,
  preferredBgUnits,
}: PumpSettingsSectionProps) {
  const { locale } = useLocale();

  const groups = useMemo(
    () => groupPumpSettingsByDevice(pumpSettings),
    [pumpSettings],
  );

  const [deviceKey, setDeviceKey] = useState<string>(() => {
    const initial = groupPumpSettingsByDevice(pumpSettings);
    return (initial.find((g) => g.active) ?? initial[0])?.key ?? '';
  });
  const [versionIndex, setVersionIndex] = useState<number>(0);
  const { compareToPrevious: compare, setCompareToPrevious: setCompare } =
    usePumpSettingsCompare();

  const selectedGroup = useMemo(
    () => groups.find((g) => g.key === deviceKey) ?? groups[0] ?? null,
    [groups, deviceKey],
  );
  const version = useMemo(
    () =>
      selectedGroup
        ? (selectedGroup.versions[versionIndex] ??
          selectedGroup.versions[0] ??
          null)
        : null,
    [selectedGroup, versionIndex],
  );
  const previousVersion = useMemo(
    () =>
      compare && selectedGroup
        ? (selectedGroup.versions[versionIndex + 1] ?? null)
        : null,
    [compare, selectedGroup, versionIndex],
  );
  const isComparing = compare && !!previousVersion;
  const isEarliest =
    !!selectedGroup && versionIndex >= selectedGroup.versions.length - 1;

  // Determine BG unit: prefer the clinic's preferredBgUnits, then the selected
  // version's native setting, then default to mg/dL.
  const getDefaultUseMgdl = useCallback(
    (settings: PumpSettings | null) =>
      preferredBgUnits !== undefined
        ? preferredBgUnits === 'mg/dL'
        : settings?.units?.bg === 'mg/dL',
    [preferredBgUnits],
  );

  const [useMgdl, setUseMgdl] = useState(() =>
    getDefaultUseMgdl(version ?? null),
  );

  // Reset device + version selection when the pumpSettings array changes.
  useEffect(() => {
    setDeviceKey((current) => {
      if (groups.some((g) => g.key === current)) return current;
      return (groups.find((g) => g.active) ?? groups[0])?.key ?? '';
    });
    setVersionIndex(0);
  }, [groups]);

  // Sync BG unit toggle when the clinic preference or selected version changes.
  useEffect(() => {
    setUseMgdl(getDefaultUseMgdl(version));
  }, [getDefaultUseMgdl, version]);

  const formatDate = (dateStr: string) => formatDateWithTime(dateStr, locale);
  const formatDay = (dateStr: string) =>
    formatShortDate(dateStr, locale) ?? dateStr;

  const handleSelectDevice = (key: string) => {
    setDeviceKey(key);
    setVersionIndex(0);
  };

  // Device dropdown rows — friendly names resolved here
  const deviceDisplays: DeviceDisplay[] = useMemo(
    () =>
      groups.map((g) => {
        const rep = g.versions[0];
        return {
          key: g.key,
          manufacturer:
            getPlatformDeviceLabel(rep) ||
            (rep.manufacturers?.length ? rep.manufacturers.join(', ') : null),
          model:
            getFriendlyDeviceName({
              deviceName: rep.name,
              deviceModel: rep.model,
              deviceManufacturers: rep.manufacturers,
              deviceId: rep.deviceId,
              origin: rep.origin,
              client: rep.client,
            }) ||
            rep.model ||
            null,
          serial: rep.serialNumber,
          lastUpload: formatDay(rep.time),
          versionCount: g.versions.length,
          active: g.active,
        };
      }),
    // formatDay depends only on locale
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, locale],
  );

  const versionDisplays: VersionDisplay[] = useMemo(() => {
    if (!selectedGroup) return [];
    const { versions } = selectedGroup;
    return versions.map((v, i) => {
      const range = getVersionRange(versions, i);
      const older = versions[i + 1];
      return {
        index: i,
        rangeLabel: `${formatDay(range.start)} – ${
          range.end ? formatDay(range.end) : 'present'
        }`,
        isCurrent: i === 0,
        isInitial: i === versions.length - 1,
        changeCount: older ? buildSettingsChanges(v, older).length : 0,
      };
    });
    // formatDay depends only on locale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, locale]);

  const representative = selectedGroup?.versions[0] ?? null;
  const manufacturerDisplay = representative
    ? getPlatformDeviceLabel(representative) ||
      (representative.manufacturers?.length
        ? representative.manufacturers.join(', ')
        : null)
    : null;
  const modelDisplay = representative
    ? getFriendlyDeviceName({
        deviceName: representative.name,
        deviceModel: representative.model,
        deviceManufacturers: representative.manufacturers,
        deviceId: representative.deviceId,
        origin: representative.origin,
        client: representative.client,
      }) ||
      representative.model ||
      null
    : null;
  const firmwareDisplay =
    version?.firmwareVersion ?? version?.softwareVersion ?? null;

  // BG units toggle component for header
  const bgUnitsToggle = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[color:var(--text-muted)]">mg/dL</span>
      <Switch
        size="sm"
        isSelected={!useMgdl}
        onValueChange={(val) => setUseMgdl(!val)}
        aria-label="Toggle BG units"
        classNames={{
          wrapper: '!bg-primary',
        }}
      />
      <span className="text-sm text-[color:var(--text-muted)]">mmol/L</span>
    </div>
  );

  if (isLoading) {
    return (
      <SectionPanel
        icon={<Settings className="w-5 h-5" />}
        title="Pump Settings"
        subtitle="View device settings and schedules"
        aria-label="Pump settings section"
      >
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" label="Loading pump settings..." />
        </div>
      </SectionPanel>
    );
  }

  // Check if there's an error state to display
  if (pumpSettingsState?.status === 'error') {
    return (
      <SectionPanel
        icon={<Settings className="w-5 h-5" />}
        title="Pump Settings"
        subtitle="View device settings and schedules"
        aria-label="Pump settings section"
      >
        <ResourceError
          title="Pump Settings"
          message={pumpSettingsState.error.message}
        />
      </SectionPanel>
    );
  }

  if (pumpSettings.length === 0 || !version || !selectedGroup) {
    return (
      <SectionPanel
        icon={<Settings className="w-5 h-5" />}
        title="Pump Settings"
        subtitle="View device settings and schedules"
        aria-label="Pump settings section"
      >
        <div className="flex flex-col justify-center items-center py-8 gap-2">
          <Settings
            className="w-12 h-12 text-[color:var(--text-faint)]"
            aria-hidden="true"
          />
          <span className="text-[color:var(--text-muted)]">
            No pump settings found
          </span>
        </div>
      </SectionPanel>
    );
  }

  // Typed schedule maps for the selected version and its comparison base.
  const basalCurr = version.basalSchedules ?? {};
  const basalPrev = previousVersion?.basalSchedules;
  const bgCurr = getCategorySchedules(version, 'bgTargets') as Record<
    string,
    BGTargetEntry[]
  >;
  const bgPrev = previousVersion
    ? (getCategorySchedules(previousVersion, 'bgTargets') as Record<
        string,
        BGTargetEntry[]
      >)
    : undefined;
  const carbCurr = getCategorySchedules(version, 'carbRatios') as Record<
    string,
    CarbRatioEntry[]
  >;
  const carbPrev = previousVersion
    ? (getCategorySchedules(previousVersion, 'carbRatios') as Record<
        string,
        CarbRatioEntry[]
      >)
    : undefined;
  const isfCurr = getCategorySchedules(version, 'insulinSensitivity') as Record<
    string,
    InsulinSensitivityEntry[]
  >;
  const isfPrev = previousVersion
    ? (getCategorySchedules(previousVersion, 'insulinSensitivity') as Record<
        string,
        InsulinSensitivityEntry[]
      >)
    : undefined;

  // When comparing, union schedule names from both snapshots so a schedule that
  // exists on only one side (wholly added or removed) still renders its table.
  const unionScheduleNames = (
    curr: Record<string, unknown>,
    prev: Record<string, unknown> | undefined,
  ): string[] =>
    isComparing && prev
      ? [...new Set([...Object.keys(curr), ...Object.keys(prev)])]
      : Object.keys(curr);

  const basalScheduleNames = unionScheduleNames(basalCurr, basalPrev);
  const bgTargetScheduleNames = unionScheduleNames(bgCurr, bgPrev);
  const carbRatioScheduleNames = unionScheduleNames(carbCurr, carbPrev);
  const insulinSensitivityScheduleNames = unionScheduleNames(isfCurr, isfPrev);

  const renderBasalScheduleTable = (scheduleName: string) => {
    const rows = toDiffRows<BasalScheduleEntry>(
      basalCurr[scheduleName],
      basalPrev?.[scheduleName],
      ['rate'],
      isComparing,
    );
    const currentEntries = rows
      .filter((r) => r.status !== 'removed')
      .map((r) => r.entry)
      .sort((a, b) => a.start - b.start);
    let totalDaily = 0;
    for (let i = 0; i < currentEntries.length; i++) {
      const entry = currentEntries[i];
      const nextStart =
        i < currentEntries.length - 1
          ? currentEntries[i + 1].start
          : 24 * 60 * 60 * 1000;
      totalDaily += entry.rate * ((nextStart - entry.start) / (1000 * 60 * 60));
    }

    return (
      <div key={scheduleName} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">{scheduleName}</span>
          {version.activeSchedule === scheduleName && (
            <Chip
              size="sm"
              color="primary"
              variant="flat"
              radius="sm"
              classNames={{ content: 'font-mono' }}
            >
              Active
            </Chip>
          )}
          <span className="text-xs text-[color:var(--text-faint)] ml-auto">
            Total: {totalDaily.toFixed(2)} U/day
          </span>
        </div>
        <Table
          aria-label={`Basal schedule ${scheduleName}`}
          removeWrapper
          isCompact
        >
          <TableHeader>
            <TableColumn>Time</TableColumn>
            <TableColumn>Rate (U/hr)</TableColumn>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${scheduleName}-${row.start}`}>
                <TableCell
                  className={`${cellBgClass(row.status)} ${cellAccentClass(row.status)}`}
                >
                  {msToTime(row.entry.start)}
                  <RowTag status={row.status} />
                </TableCell>
                <TableCell className={cellBgClass(row.status)}>
                  {renderValueCell(row, 'rate', (v) =>
                    v === undefined ? '-' : v.toFixed(3),
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderBgTargetTable = (scheduleName: string) => {
    const rows = toDiffRows<BGTargetEntry>(
      bgCurr[scheduleName],
      bgPrev?.[scheduleName],
      ['target', 'low', 'high', 'range'],
      isComparing,
    );
    const columns = presentBgColumns(rows);

    return (
      <div key={scheduleName} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">{scheduleName}</span>
        </div>
        <Table
          aria-label={`BG targets ${scheduleName}`}
          removeWrapper
          isCompact
        >
          <TableHeader>
            {[
              <TableColumn key="time">Time</TableColumn>,
              ...columns.map((col) => (
                <TableColumn key={col.key}>{col.header}</TableColumn>
              )),
            ]}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${scheduleName}-${row.start}`}>
                {[
                  <TableCell
                    key="time"
                    className={`${cellBgClass(row.status)} ${cellAccentClass(row.status)}`}
                  >
                    {msToTime(row.entry.start)}
                    <RowTag status={row.status} />
                  </TableCell>,
                  ...columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cellBgClass(row.status)}
                    >
                      {renderValueCell(
                        row,
                        col.key,
                        (v) => formatBgValue(v, useMgdl) || '-',
                      )}
                    </TableCell>
                  )),
                ]}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderCarbRatioTable = (scheduleName: string) => {
    const rows = toDiffRows<CarbRatioEntry>(
      carbCurr[scheduleName],
      carbPrev?.[scheduleName],
      ['amount'],
      isComparing,
    );

    return (
      <div key={scheduleName} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">{scheduleName}</span>
        </div>
        <Table
          aria-label={`Carb ratios ${scheduleName}`}
          removeWrapper
          isCompact
        >
          <TableHeader>
            <TableColumn>Time</TableColumn>
            <TableColumn>Carb Ratio (g/U)</TableColumn>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${scheduleName}-${row.start}`}>
                <TableCell
                  className={`${cellBgClass(row.status)} ${cellAccentClass(row.status)}`}
                >
                  {msToTime(row.entry.start)}
                  <RowTag status={row.status} />
                </TableCell>
                <TableCell className={cellBgClass(row.status)}>
                  {renderValueCell(row, 'amount', (v) =>
                    v === undefined ? '-' : String(v),
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderInsulinSensitivityTable = (scheduleName: string) => {
    const rows = toDiffRows<InsulinSensitivityEntry>(
      isfCurr[scheduleName],
      isfPrev?.[scheduleName],
      ['amount'],
      isComparing,
    );

    return (
      <div key={scheduleName} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">{scheduleName}</span>
        </div>
        <Table
          aria-label={`Insulin sensitivity ${scheduleName}`}
          removeWrapper
          isCompact
        >
          <TableHeader>
            <TableColumn>Time</TableColumn>
            <TableColumn>Sensitivity (per U)</TableColumn>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${scheduleName}-${row.start}`}>
                <TableCell
                  className={`${cellBgClass(row.status)} ${cellAccentClass(row.status)}`}
                >
                  {msToTime(row.entry.start)}
                  <RowTag status={row.status} />
                </TableCell>
                <TableCell className={cellBgClass(row.status)}>
                  {renderValueCell(row, 'amount', (v) =>
                    formatInsulinSensitivity(v ?? 0, useMgdl),
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <SectionPanel
      icon={<Settings className="w-5 h-5" />}
      title="Pump Settings"
      subtitle="View device settings and schedules"
      headerControls={bgUnitsToggle}
      aria-label="Pump settings section"
    >
      <div className="flex flex-col gap-4">
        {/* Device + version controls */}
        <div className="flex flex-wrap items-center gap-3">
          <DeviceSelector
            devices={deviceDisplays}
            selectedKey={deviceKey}
            onSelect={handleSelectDevice}
          />
          <span className="text-sm text-[color:var(--text-faint)]">
            View settings from
          </span>
          <SettingsVersionSelector
            versions={versionDisplays}
            selectedIndex={versionIndex}
            onSelect={setVersionIndex}
          />
          <Switch
            className="ml-auto"
            size="sm"
            isSelected={compare}
            isDisabled={isEarliest}
            onValueChange={setCompare}
            classNames={{
              label: 'text-[13px] text-[color:var(--text-muted)]',
            }}
          >
            Compare to previous
          </Switch>
        </div>

        {/* Device meta strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[6px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm">
          {manufacturerDisplay && (
            <div>
              <span className="text-[color:var(--text-faint)]">
                Manufacturer:
              </span>{' '}
              <span>{manufacturerDisplay}</span>
            </div>
          )}
          {modelDisplay && (
            <div>
              <span className="text-[color:var(--text-faint)]">Model:</span>{' '}
              <span>{modelDisplay}</span>
            </div>
          )}
          {representative?.serialNumber && (
            <div>
              <span className="text-[color:var(--text-faint)]">Serial:</span>{' '}
              <span className="font-mono">{representative.serialNumber}</span>
            </div>
          )}
          {firmwareDisplay && (
            <div>
              <span className="text-[color:var(--text-faint)]">Firmware:</span>{' '}
              <span className="font-mono">{firmwareDisplay}</span>
            </div>
          )}
          {representative && (
            <div>
              <span className="text-[color:var(--text-faint)]">
                Last upload:
              </span>{' '}
              <span>{formatDate(representative.time)}</span>
            </div>
          )}
          {selectedGroup.active ? (
            <Chip
              size="sm"
              color="success"
              variant="flat"
              radius="full"
              classNames={{ content: 'font-medium' }}
            >
              Active device
            </Chip>
          ) : (
            <div>
              <span className="text-[color:var(--text-faint)]">Status:</span>{' '}
              <span>Inactive</span>
            </div>
          )}
          {version.activeSchedule && (
            <div className="flex items-center gap-1">
              <span className="text-[color:var(--text-faint)]">
                Active Schedule:
              </span>{' '}
              <Chip
                size="sm"
                color="primary"
                variant="flat"
                radius="sm"
                classNames={{ content: 'font-mono' }}
              >
                {version.activeSchedule}
              </Chip>
            </div>
          )}
        </div>

        {/* Change summary */}
        {compare && (
          <PumpSettingsDiffSummary
            changes={
              previousVersion
                ? buildSettingsChanges(version, previousVersion)
                : []
            }
            prevDateLabel={
              previousVersion ? formatDay(previousVersion.time) : null
            }
            useMgdl={useMgdl}
          />
        )}

        {/* Settings tabs */}
        <ProfileTabs aria-label="Pump settings tabs">
          {/* Basal Schedules */}
          <Tab
            key="basal"
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>Basal ({basalScheduleNames.length})</span>
              </div>
            }
          >
            <div className="py-4">
              {basalScheduleNames.length > 0 ? (
                basalScheduleNames.map((name) => renderBasalScheduleTable(name))
              ) : (
                <div className="text-center text-[color:var(--text-faint)] py-4">
                  No basal schedules available
                </div>
              )}
            </div>
          </Tab>

          {/* BG Targets */}
          <Tab
            key="bgTargets"
            title={
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" aria-hidden="true" />
                <span>BG Targets ({bgTargetScheduleNames.length})</span>
              </div>
            }
          >
            <div className="py-4">
              {bgTargetScheduleNames.length > 0 ? (
                bgTargetScheduleNames.map((name) => renderBgTargetTable(name))
              ) : (
                <div className="text-center text-[color:var(--text-faint)] py-4">
                  No BG targets available
                </div>
              )}
            </div>
          </Tab>

          {/* Carb Ratios */}
          <Tab
            key="carbRatios"
            title={
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4" aria-hidden="true" />
                <span>Carb Ratios ({carbRatioScheduleNames.length})</span>
              </div>
            }
          >
            <div className="py-4">
              {carbRatioScheduleNames.length > 0 ? (
                carbRatioScheduleNames.map((name) => renderCarbRatioTable(name))
              ) : (
                <div className="text-center text-[color:var(--text-faint)] py-4">
                  No carb ratios available
                </div>
              )}
            </div>
          </Tab>

          {/* Insulin Sensitivity */}
          <Tab
            key="insulinSensitivity"
            title={
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span>ISF ({insulinSensitivityScheduleNames.length})</span>
              </div>
            }
          >
            <div className="py-4">
              {insulinSensitivityScheduleNames.length > 0 ? (
                insulinSensitivityScheduleNames.map((name) =>
                  renderInsulinSensitivityTable(name),
                )
              ) : (
                <div className="text-center text-[color:var(--text-faint)] py-4">
                  No insulin sensitivity factors available
                </div>
              )}
            </div>
          </Tab>
        </ProfileTabs>
      </div>
    </SectionPanel>
  );
}
