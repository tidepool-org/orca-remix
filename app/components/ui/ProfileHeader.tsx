import { ReactNode, useState } from 'react';
import Well from '~/partials/Well';
import ClipboardButton from '../ClipboardButton';
import DetailsToggleButton from './DetailsToggleButton';

export type CopyableIdentifier = {
  /** Optional label displayed before the value (e.g., "ID:", "MRN:") */
  label?: string;
  /** The value to display and copy */
  value: string;
  /** Whether to display the value in monospace font */
  monospace?: boolean;
};

export type DetailField = {
  /** Label for the field */
  label: string;
  /** Value to display - can be string or ReactNode for custom rendering (chips, badges, etc.) */
  value: ReactNode;
};

export type ProfileHeaderProps = {
  /** The main title (e.g., user's full name, clinic name) */
  title: string;
  /** Array of copyable identifiers to display in row 2 (email, ID, MRN, etc.) */
  identifiers?: CopyableIdentifier[];
  /** Optional link to display after identifiers */
  actionLink?: ReactNode;
  /** Array of detail fields to display in the expandable section */
  detailFields?: DetailField[];
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
  actionLink,
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
    <Well className="!gap-0">
      {/* Row 1: Title on left, toggle button on right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {titleRowExtra}
        </div>
        {hasExpandableContent && (
          <DetailsToggleButton
            isExpanded={isExpanded}
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* Row 2: Copyable identifiers and optional action link */}
      {(identifiers.length > 0 || actionLink) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
          {identifiers.map((identifier, index) => (
            <span
              key={index}
              className="flex items-center gap-1 text-default-500"
            >
              {identifier.label && (
                <span className="text-default-400">{identifier.label}</span>
              )}
              <span
                className={
                  identifier.monospace
                    ? 'font-mono text-xs'
                    : identifier.label
                      ? 'font-mono text-xs'
                      : 'text-default-600'
                }
              >
                {identifier.value}
              </span>
              <ClipboardButton clipboardText={identifier.value} />
            </span>
          ))}
          {actionLink}
        </div>
      )}

      {/* Collapsible details section */}
      {hasExpandableContent && isExpanded && (
        <div className="mt-4 pt-4 border-t border-divider">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3 text-sm">
            {detailFields.map((field, index) => (
              <div key={index}>
                <span className="text-default-400 block text-xs">
                  {field.label}
                </span>
                <span className="text-default-600">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Well>
  );
}
