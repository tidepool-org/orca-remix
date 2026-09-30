import { type ReactNode } from 'react';

export type SettingRowProps = {
  /** Setting label shown on the left */
  label: string;
  /** Optional description shown below the label */
  description?: ReactNode;
  /** Right-side control (Select / Input / Switch / read-only value) */
  control?: ReactNode;
  /** Optional id to associate the label with a native control for a11y */
  htmlFor?: string;
};

/**
 * A presentational hairline setting row: label + optional description on the
 * left, a control slot on the right. Non-first rows get a top hairline
 * divider; the first row does not (`first:border-t-0`). Mirrors the
 * `ActionCard` row chrome. Callers size the control themselves.
 *
 * @example
 * <SettingRow
 *   label="Clinic Tier"
 *   description="Controls which features are available."
 *   control={<Select aria-label="Clinic tier">…</Select>}
 * />
 */
export default function SettingRow({
  label,
  description,
  control,
  htmlFor,
}: SettingRowProps) {
  const labelClasses =
    'text-[13px] font-semibold text-[color:var(--text-heading)]';

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-[color:var(--border)] first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClasses}>
            {label}
          </label>
        ) : (
          <p className={labelClasses}>{label}</p>
        )}
        {description && (
          <p className="text-[12px] text-[color:var(--text-muted)] mt-[3px]">
            {description}
          </p>
        )}
      </div>
      {control && <div className="flex-none">{control}</div>}
    </div>
  );
}
