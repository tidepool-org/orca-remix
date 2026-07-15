import { ReactNode, useState } from 'react';
import CopyableIdentifier from './CopyableIdentifier';
import DetailsToggleButton from './DetailsToggleButton';

export type IdentifierConfig = {
  /** Optional label displayed before the value (e.g., "ID:", "MRN:") */
  label?: string;
  /** The value to display and copy */
  value: string;
  /** Whether to display the value in monospace font */
  monospace?: boolean;
};

export type DetailFieldConfig = {
  /** Label for the field */
  label: string;
  /** Value to display - can be string or ReactNode for custom rendering (chips, badges, etc.) */
  value: ReactNode;
};

export type ProfileHeaderProps = {
  /** The main title (e.g., user's full name, clinic name) */
  title: string;
  /** Array of copyable identifiers to display in row 2 (email, ID, MRN, etc.) */
  identifiers?: IdentifierConfig[];
  /** Optional links to display after identifiers */
  actionLinks?: ReactNode[];
  /** Array of detail fields to display in the expandable section */
  detailFields?: DetailFieldConfig[];
  /** Whether to start with details expanded */
  defaultExpanded?: boolean;
  /** Callback when expansion state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Custom content to render after the title row */
  titleRowExtra?: ReactNode;
};

export default function ProfileHeader({
  title,
  identifiers = [],
  actionLinks = [],
  detailFields = [],
  defaultExpanded = false,
  onExpandedChange,
  titleRowExtra,
}: ProfileHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const hasExpandableContent = detailFields.length > 0;

  return (
    <div className="w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-token overflow-hidden">
      {/* entity-head: 16px pad */}
      <div className="p-4">
        {/* entity-top: title block + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[19px] font-bold tracking-[-0.01em] leading-tight text-[color:var(--text-heading)] m-0">
                {title}
              </h1>
              {titleRowExtra}
            </div>
            {/* entity-meta: 9px row gap × 26px col gap, 12.5px text-muted */}
            {(identifiers.length > 0 || actionLinks.length > 0) && (
              <div className="flex flex-wrap items-center gap-y-[9px] gap-x-[26px] mt-[9px] text-[12.5px] text-[color:var(--text-muted)]">
                {identifiers.map((identifier, index) => (
                  <CopyableIdentifier
                    key={`${identifier.label ?? 'id'}-${index}`}
                    label={identifier.label}
                    value={identifier.value}
                    monospace={identifier.monospace}
                  />
                ))}
                {actionLinks.map((link, index) => (
                  <span key={`action-${index}`}>{link}</span>
                ))}
              </div>
            )}
          </div>
          {hasExpandableContent && (
            <DetailsToggleButton
              isExpanded={isExpanded}
              onToggle={handleToggle}
            />
          )}
        </div>

        {/* entity-stats: 3-col grid with 1px dividers drawn per-cell. Each cell
            draws top + bottom + left borders offset by negative margins so shared
            edges collapse to a single 1px line (against neighbors and the outer
            border alike). Drawing bottom per-cell — not relying on the next row's
            top border — keeps a ragged last row from leaving the cells above its
            empty tracks without a bottom edge. No right border: a trailing empty
            column stays open (no background, no orphan border). */}
        {hasExpandableContent && isExpanded && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 overflow-hidden rounded-[6px] border border-[color:var(--border)] bg-[color:var(--surface)]">
            {detailFields.map((field, i) => (
              <div
                key={i}
                className="bg-[color:var(--surface)] py-[11px] px-[14px] -mt-px -mb-px -ml-px border-t border-b border-l border-[color:var(--border)]"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[color:var(--text-faint)]">
                  {field.label}
                </div>
                <div className="mt-1 text-[13.5px] font-semibold text-[color:var(--text)] flex items-center gap-[7px] flex-wrap">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
