import React, { ReactNode, useId } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useCollapsibleGroup } from './CollapsibleGroup';

export type CollapsibleTableWrapperProps = {
  icon: ReactNode;
  title: string;
  totalItems: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  showRange?: {
    firstItem: number;
    lastItem: number;
  };
  defaultExpanded?: boolean;
  /** Mark this as the first collapsible in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
  /** When provided, renders a CSV export button that downloads from this URL */
  exportHref?: string;
};

export default function CollapsibleTableWrapper({
  icon,
  title,
  totalItems,
  isExpanded: controlledExpanded,
  onToggle,
  children,
  showRange,
  defaultExpanded,
  isFirstInGroup = false,
  exportHref,
}: CollapsibleTableWrapperProps) {
  // If isFirstInGroup is true and we're within a CollapsibleGroup,
  // use the group's defaultExpanded setting
  const groupDefaultExpanded = useCollapsibleGroup();
  const shouldExpandFromGroup = isFirstInGroup && groupDefaultExpanded;
  const effectiveDefaultExpanded = defaultExpanded ?? shouldExpandFromGroup;

  const [internalExpanded, setInternalExpanded] = React.useState(
    effectiveDefaultExpanded,
  );

  // Use controlled state if provided, otherwise use internal state
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Reference design: panel header shows just the title in uppercase tracked label,
  // and the showing-range (when expanded) sits right-aligned in the same row.
  const formattedTotal = totalItems.toLocaleString();
  const showingText =
    isExpanded && showRange && totalItems > 0
      ? `Showing ${showRange.firstItem.toLocaleString()}–${showRange.lastItem.toLocaleString()} of ${formattedTotal}`
      : !isExpanded && totalItems > 0
        ? `${formattedTotal} total`
        : '';

  const panelId = useId();
  const headingId = useId();

  return (
    <div className="w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden shadow-token">
      <button
        className={`flex justify-between items-center w-full px-4 min-h-[43px] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)] transition-colors cursor-pointer ${
          isExpanded ? 'border-b border-[color:var(--border)]' : ''
        }`}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-labelledby={headingId}
      >
        <div className="flex gap-2 items-center">
          <span
            className="inline-grid place-items-center w-[22px] h-[22px] flex-none [&_svg]:w-4 [&_svg]:h-4 text-[color:var(--primary)]"
            aria-hidden="true"
          >
            {icon}
          </span>
          <span
            id={headingId}
            role="heading"
            aria-level={2}
            className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color:var(--text-heading)]"
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {showingText && (
            <span className="text-[12px] text-[color:var(--text-faint)] font-medium hidden sm:inline">
              {showingText}
            </span>
          )}
          {exportHref && (
            <Tooltip content="Export as CSV">
              <a
                href={exportHref}
                download
                aria-label={`Export ${title} as CSV`}
                className="p-1 rounded-md text-[color:var(--text-faint)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </a>
            </Tooltip>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[color:var(--text-faint)] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded && (
        <div id={panelId} className="p-4 transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
