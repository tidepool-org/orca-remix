import React, { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
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

  // Generate header text based on expanded state and showRange
  const headerText =
    isExpanded && showRange && totalItems > 0
      ? `${title} (showing ${showRange.firstItem}-${showRange.lastItem} of ${totalItems})`
      : `${title} (${totalItems})`;

  return (
    <div className="w-full rounded-lg border-2 border-content2 overflow-hidden">
      <button
        className="flex justify-between items-center w-full p-4 bg-content1 hover:bg-default/40 transition-colors cursor-pointer"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`${title
          .toLowerCase()
          .replace(/\s+/g, '-')}-table-content`}
      >
        <div className="flex gap-2 items-center">
          {icon}
          <h2 className="text-lg font-semibold">{headerText}</h2>
        </div>
        <div className="flex items-center gap-2">
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded && (
        <div
          id={`${title.toLowerCase().replace(/\s+/g, '-')}-table-content`}
          className="mt-4 p-4 transition-all duration-300"
        >
          {children}
        </div>
      )}
    </div>
  );
}
