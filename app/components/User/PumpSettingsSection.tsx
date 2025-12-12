import { useState, useMemo } from 'react';
import {
  Select,
  SelectItem,
  Chip,
  Spinner,
  Switch,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Settings, Clock, Target, Utensils, Zap } from 'lucide-react';
import { formatDateWithTime } from '~/utils/dateFormatters';
import { msToTime } from '~/utils/timeConversion';
import { formatBgValue, formatInsulinSensitivity } from '~/utils/bgUnits';
import useLocale from '~/hooks/useLocale';
import SectionPanel from '~/components/ui/SectionPanel';
import type {
  PumpSettings,
  BasalScheduleEntry,
  BGTargetEntry,
  CarbRatioEntry,
  InsulinSensitivityEntry,
} from './types';

export type PumpSettingsSectionProps = {
  pumpSettings: PumpSettings[];
  isLoading?: boolean;
};

export default function PumpSettingsSection({
  pumpSettings = [],
  isLoading = false,
}: PumpSettingsSectionProps) {
  const { locale } = useLocale();
  const [selectedSettingIndex, setSelectedSettingIndex] = useState<number>(0);
  const [useMmol, setUseMmol] = useState(false);

  // Get selected pump settings
  const selectedSettings = useMemo(() => {
    if (pumpSettings.length === 0) return null;
    return pumpSettings[selectedSettingIndex] || pumpSettings[0];
  }, [pumpSettings, selectedSettingIndex]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    return formatDateWithTime(dateStr, locale);
  };

  // Get all basal schedule names
  const basalScheduleNames = useMemo(() => {
    if (!selectedSettings?.basalSchedules) return [];
    return Object.keys(selectedSettings.basalSchedules);
  }, [selectedSettings]);

  // Get all BG target schedule names
  const bgTargetScheduleNames = useMemo(() => {
    if (selectedSettings?.bgTargets) {
      return Object.keys(selectedSettings.bgTargets);
    }
    if (selectedSettings?.bgTarget) {
      return ['Default'];
    }
    return [];
  }, [selectedSettings]);

  // Get all carb ratio schedule names
  const carbRatioScheduleNames = useMemo(() => {
    if (selectedSettings?.carbRatios) {
      return Object.keys(selectedSettings.carbRatios);
    }
    if (selectedSettings?.carbRatio) {
      return ['Default'];
    }
    return [];
  }, [selectedSettings]);

  // Get all insulin sensitivity schedule names
  const insulinSensitivityScheduleNames = useMemo(() => {
    if (selectedSettings?.insulinSensitivities) {
      return Object.keys(selectedSettings.insulinSensitivities);
    }
    if (selectedSettings?.insulinSensitivity) {
      return ['Default'];
    }
    return [];
  }, [selectedSettings]);

  // BG units toggle component for header
  const bgUnitsToggle = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-default-500">mg/dL</span>
      <Switch
        size="sm"
        isSelected={useMmol}
        onValueChange={setUseMmol}
        aria-label="Toggle BG units"
      />
      <span className="text-sm text-default-500">mmol/L</span>
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

  if (pumpSettings.length === 0) {
    return (
      <SectionPanel
        icon={<Settings className="w-5 h-5" />}
        title="Pump Settings"
        subtitle="View device settings and schedules"
        aria-label="Pump settings section"
      >
        <div className="flex flex-col justify-center items-center py-8 gap-2">
          <Settings className="w-12 h-12 text-default-300" aria-hidden="true" />
          <span className="text-default-500">No pump settings found</span>
        </div>
      </SectionPanel>
    );
  }

  const renderBasalScheduleTable = (
    scheduleName: string,
    entries: BasalScheduleEntry[],
  ) => {
    // Calculate total daily insulin
    const sortedEntries = [...entries].sort((a, b) => a.start - b.start);
    let totalDaily = 0;
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const nextStart =
        i < sortedEntries.length - 1
          ? sortedEntries[i + 1].start
          : 24 * 60 * 60 * 1000;
      const durationHours = (nextStart - entry.start) / (1000 * 60 * 60);
      totalDaily += entry.rate * durationHours;
    }

    return (
      <div key={scheduleName} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm">{scheduleName}</span>
          {selectedSettings?.activeSchedule === scheduleName && (
            <Chip size="sm" color="primary" variant="flat">
              Active
            </Chip>
          )}
          <span className="text-xs text-default-400 ml-auto">
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
            {sortedEntries.map((entry, idx) => (
              <TableRow key={`${scheduleName}-${idx}`}>
                <TableCell>{msToTime(entry.start)}</TableCell>
                <TableCell>{entry.rate.toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderBgTargetTable = (
    scheduleName: string,
    entries: BGTargetEntry[],
  ) => {
    const sortedEntries = [...entries].sort((a, b) => a.start - b.start);

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
            <TableColumn>Time</TableColumn>
            <TableColumn>Target</TableColumn>
            <TableColumn>Low</TableColumn>
            <TableColumn>High</TableColumn>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry, idx) => (
              <TableRow key={`${scheduleName}-${idx}`}>
                <TableCell>{msToTime(entry.start)}</TableCell>
                <TableCell>
                  {formatBgValue(entry.target, useMmol) || '-'}
                </TableCell>
                <TableCell>
                  {formatBgValue(entry.low, useMmol) || '-'}
                </TableCell>
                <TableCell>
                  {formatBgValue(entry.high, useMmol) || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderCarbRatioTable = (
    scheduleName: string,
    entries: CarbRatioEntry[],
  ) => {
    const sortedEntries = [...entries].sort((a, b) => a.start - b.start);

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
            {sortedEntries.map((entry, idx) => (
              <TableRow key={`${scheduleName}-${idx}`}>
                <TableCell>{msToTime(entry.start)}</TableCell>
                <TableCell>{entry.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderInsulinSensitivityTable = (
    scheduleName: string,
    entries: InsulinSensitivityEntry[],
  ) => {
    const sortedEntries = [...entries].sort((a, b) => a.start - b.start);

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
            {sortedEntries.map((entry, idx) => (
              <TableRow key={`${scheduleName}-${idx}`}>
                <TableCell>{msToTime(entry.start)}</TableCell>
                <TableCell>
                  {formatInsulinSensitivity(entry.amount, useMmol)}
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
        {/* Device info row */}
        {selectedSettings && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {selectedSettings.manufacturers &&
              selectedSettings.manufacturers.length > 0 && (
                <div>
                  <span className="text-default-400">Manufacturer:</span>{' '}
                  <span>{selectedSettings.manufacturers.join(', ')}</span>
                </div>
              )}
            {selectedSettings.model && (
              <div>
                <span className="text-default-400">Model:</span>{' '}
                <span>{selectedSettings.model}</span>
              </div>
            )}
            {selectedSettings.serialNumber && (
              <div>
                <span className="text-default-400">Serial:</span>{' '}
                <span className="font-mono">
                  {selectedSettings.serialNumber}
                </span>
              </div>
            )}
            <div>
              <span className="text-default-400">Time:</span>{' '}
              <span>{formatDate(selectedSettings.time)}</span>
            </div>
            {selectedSettings.activeSchedule && (
              <div className="flex items-center gap-1">
                <span className="text-default-400">Active Schedule:</span>{' '}
                <Chip size="sm" color="primary" variant="flat">
                  {selectedSettings.activeSchedule}
                </Chip>
              </div>
            )}
          </div>
        )}

        {/* Settings selector (only if multiple) */}
        {pumpSettings.length > 1 && (
          <Select
            label="Settings from"
            selectedKeys={[selectedSettingIndex.toString()]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected !== undefined) {
                setSelectedSettingIndex(parseInt(selected as string, 10));
              }
            }}
            size="sm"
            className="max-w-xs"
          >
            {pumpSettings.map((settings, index) => (
              <SelectItem key={index.toString()}>
                {formatDate(settings.time)}
                {settings.model ? ` - ${settings.model}` : ''}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Settings tabs */}
        <Tabs aria-label="Pump settings tabs" variant="underlined">
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
                basalScheduleNames.map((name) =>
                  renderBasalScheduleTable(
                    name,
                    selectedSettings?.basalSchedules?.[name] || [],
                  ),
                )
              ) : (
                <div className="text-center text-default-400 py-4">
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
                bgTargetScheduleNames.map((name) => {
                  const entries = selectedSettings?.bgTargets
                    ? selectedSettings.bgTargets[name]
                    : selectedSettings?.bgTarget;
                  return entries ? renderBgTargetTable(name, entries) : null;
                })
              ) : (
                <div className="text-center text-default-400 py-4">
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
                carbRatioScheduleNames.map((name) => {
                  const entries = selectedSettings?.carbRatios
                    ? selectedSettings.carbRatios[name]
                    : selectedSettings?.carbRatio;
                  return entries ? renderCarbRatioTable(name, entries) : null;
                })
              ) : (
                <div className="text-center text-default-400 py-4">
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
                insulinSensitivityScheduleNames.map((name) => {
                  const entries = selectedSettings?.insulinSensitivities
                    ? selectedSettings.insulinSensitivities[name]
                    : selectedSettings?.insulinSensitivity;
                  return entries
                    ? renderInsulinSensitivityTable(name, entries)
                    : null;
                })
              ) : (
                <div className="text-center text-default-400 py-4">
                  No insulin sensitivity factors available
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </SectionPanel>
  );
}
