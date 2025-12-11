import { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
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
import { Settings, Clock, Target, Utensils, Zap, Info } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
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

// Convert milliseconds from midnight to time string (HH:MM)
function msToTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Convert mg/dL to mmol/L
function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.0182) * 10) / 10;
}

// Format BG value with units
function formatBgValue(
  value: number | undefined,
  useMmol: boolean,
): string | null {
  if (value === undefined || value === null) return null;
  if (useMmol) {
    return `${mgdlToMmol(value)} mmol/L`;
  }
  return `${value} mg/dL`;
}

// Format insulin sensitivity with units
function formatInsulinSensitivity(value: number, useMmol: boolean): string {
  if (useMmol) {
    return `${mgdlToMmol(value)} mmol/L`;
  }
  return `${value} mg/dL`;
}

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
    return intlFormat(
      new Date(dateStr),
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
      { locale },
    );
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

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <p className="text-md font-semibold">Pump Settings</p>
            <p className="text-small text-default-500">
              View device settings and schedules
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex justify-center items-center py-8">
          <Spinner size="lg" label="Loading pump settings..." />
        </CardBody>
      </Card>
    );
  }

  if (pumpSettings.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <p className="text-md font-semibold">Pump Settings</p>
            <p className="text-small text-default-500">
              View device settings and schedules
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col justify-center items-center py-8 gap-2">
          <Settings className="w-12 h-12 text-default-300" aria-hidden="true" />
          <span className="text-default-500">No pump settings found</span>
        </CardBody>
      </Card>
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
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <Settings className="w-5 h-5 text-primary" />
        <div className="flex flex-col flex-1">
          <p className="text-md font-semibold">Pump Settings</p>
          <p className="text-small text-default-500">
            View device settings and schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* Settings selector */}
        {pumpSettings.length > 1 && (
          <div className="flex items-center gap-4">
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
          </div>
        )}

        {/* Device info */}
        {selectedSettings && (
          <div className="bg-default-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-default-500" />
              <span className="text-sm font-medium">Device Information</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                <div>
                  <span className="text-default-400">Active Schedule:</span>{' '}
                  <Chip size="sm" color="primary" variant="flat">
                    {selectedSettings.activeSchedule}
                  </Chip>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings tabs */}
        <Tabs aria-label="Pump settings tabs" variant="underlined">
          {/* Basal Schedules */}
          <Tab
            key="basal"
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
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
                <Target className="w-4 h-4" />
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
                <Utensils className="w-4 h-4" />
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
                <Zap className="w-4 h-4" />
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
      </CardBody>
    </Card>
  );
}
