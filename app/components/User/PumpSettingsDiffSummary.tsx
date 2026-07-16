import { ArrowLeftRight, Check, Info } from 'lucide-react';
import { msToTime } from '~/utils/timeConversion';
import { formatBgValue, formatInsulinSensitivity } from '~/utils/bgUnits';
import {
  CATEGORY_KEYS,
  type SettingsCategory,
  type SettingsChange,
} from '~/utils/pumpSettingsDiff';

export type PumpSettingsDiffSummaryProps = {
  changes: SettingsChange[];
  prevDateLabel: string | null;
  useMgdl: boolean;
};

const CATEGORY_LABEL: Record<SettingsCategory, string> = {
  basal: 'Basal',
  bgTargets: 'BG Targets',
  carbRatios: 'Carb Ratios',
  insulinSensitivity: 'ISF',
};

const KEY_LABEL: Record<string, string> = {
  target: 'Tgt',
  low: 'Low',
  high: 'High',
  range: 'Range',
};

const unitFor = (category: SettingsCategory, useMgdl: boolean): string => {
  const bg = useMgdl ? 'mg/dL' : 'mmol/L';
  switch (category) {
    case 'basal':
      return 'U/hr';
    case 'carbRatios':
      return 'g/U';
    case 'bgTargets':
      return bg;
    case 'insulinSensitivity':
      return `${bg}/U`;
  }
};

const formatValue = (
  category: SettingsCategory,
  value: unknown,
  useMgdl: boolean,
): string => {
  if (value == null) return '—';
  switch (category) {
    case 'basal':
      return (value as number).toFixed(3);
    case 'carbRatios':
      return String(value);
    case 'bgTargets':
      return formatBgValue(value as number, useMgdl) || '—';
    case 'insulinSensitivity':
      return formatInsulinSensitivity(value as number, useMgdl);
  }
};

export default function PumpSettingsDiffSummary({
  changes,
  prevDateLabel,
  useMgdl,
}: PumpSettingsDiffSummaryProps) {
  // Earliest recorded version — nothing older to compare against.
  if (prevDateLabel === null) {
    return (
      <div className="rounded-[6px] border border-[color:var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 py-3 text-[color:var(--text-faint)] text-[12.5px]">
          <Info className="w-[15px] h-[15px]" aria-hidden="true" />
          Earliest recorded settings for this device — nothing to compare
          against.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[6px] border border-[color:var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[color:var(--primary-soft)] text-[color:var(--primary-soft-fg)] font-semibold text-xs uppercase tracking-wide">
        <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
        Changes from {prevDateLabel}
        <span className="ml-auto font-mono tracking-normal normal-case">
          {changes.length} change{changes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {changes.length === 0 ? (
        <div className="flex items-center gap-2 px-3.5 py-3 text-[color:var(--text-faint)] text-[12.5px]">
          <Check className="w-[15px] h-[15px]" aria-hidden="true" />
          No differences — settings identical to the previous version.
        </div>
      ) : (
        <ul className="px-3.5 pt-1 pb-2.5">
          {changes.map((change) => {
            const keys = CATEGORY_KEYS[change.category];
            const where = `${CATEGORY_LABEL[change.category]} · ${change.schedule} · ${msToTime(change.start)}`;
            return (
              <li
                key={`${change.category}-${change.schedule}-${change.start}`}
                className="flex items-center gap-3 py-1.5 text-[12.5px] border-t border-[color:var(--border)] first:border-t-0"
              >
                <span
                  className={`w-14 flex-none text-[9.5px] font-bold uppercase tracking-wide ${
                    change.status === 'changed'
                      ? 'text-[color:var(--warn)]'
                      : change.status === 'added'
                        ? 'text-[color:var(--ok)]'
                        : 'text-[color:var(--danger)]'
                  }`}
                >
                  {change.status}
                </span>
                <span className="text-[color:var(--text-muted)]">{where}</span>
                <span className="ml-auto font-mono flex items-center gap-1.5 whitespace-nowrap">
                  {change.status === 'changed' ? (
                    Object.entries(change.changes).map(([key, ch]) => (
                      <span key={key} className="flex items-center gap-1.5">
                        {KEY_LABEL[key] ? `${KEY_LABEL[key]} ` : ''}
                        <span className="text-[color:var(--text-faint)] line-through">
                          {formatValue(change.category, ch?.from, useMgdl)}
                        </span>
                        <span className="text-[color:var(--text-faint)]">
                          →
                        </span>
                        <span className="font-semibold">
                          {formatValue(change.category, ch?.to, useMgdl)}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span
                      className={
                        change.status === 'removed'
                          ? 'text-[color:var(--text-faint)] line-through'
                          : 'font-semibold'
                      }
                    >
                      {keys
                        .filter(
                          (key) =>
                            (change.entry as Record<string, unknown>)[key] !=
                            null,
                        )
                        .map((key) =>
                          formatValue(
                            change.category,
                            (change.entry as Record<string, unknown>)[key],
                            useMgdl,
                          ),
                        )
                        .join(' / ')}
                    </span>
                  )}
                  <span className="text-[color:var(--text-faint)]">
                    {unitFor(change.category, useMgdl)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
