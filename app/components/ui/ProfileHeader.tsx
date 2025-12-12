import { ReactNode, useState } from 'react';
import Well from '~/partials/Well';
import CopyableIdentifier from './CopyableIdentifier';
import DetailGrid from './DetailGrid';
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
  /** Optional link to display after identifiers */
  actionLink?: ReactNode;
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
            <CopyableIdentifier
              key={index}
              label={identifier.label}
              value={identifier.value}
              monospace={identifier.monospace}
            />
          ))}
          {actionLink}
        </div>
      )}

      {/* Collapsible details section */}
      {hasExpandableContent && isExpanded && (
        <div className="mt-4 pt-4 border-t border-divider">
          <DetailGrid
            fields={detailFields}
            columns={{ default: 2, sm: 3, md: 4, lg: 5 }}
            columnGap="gap-x-6"
            rowGap="gap-y-3"
          />
        </div>
      )}
    </Well>
  );
}
