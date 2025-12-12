import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SectionPanelProps = {
  /** Icon to display in the header (optional) */
  icon?: ReactNode;
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Content to render inside the panel */
  children: ReactNode;
  /** Controls to render on the right side of the header (e.g., toggles, buttons) */
  headerControls?: ReactNode;
  /** Whether the panel is collapsible (default: false) */
  collapsible?: boolean;
  /** Controlled expanded state (for collapsible panels) */
  isExpanded?: boolean;
  /** Callback when expanded state changes */
  onToggle?: () => void;
  /** Default expanded state for uncontrolled collapsible panels */
  defaultExpanded?: boolean;
  /** Aria label for the section */
  'aria-label'?: string;
};

/**
 * SectionPanel - A container component that matches the CollapsibleTableWrapper styling.
 *
 * Use this for non-table content sections that need consistent styling with table sections.
 * Supports optional collapsibility and header controls.
 *
 * @example
 * ```tsx
 * // Non-collapsible panel with icon
 * <SectionPanel icon={<Download />} title="Export Data" subtitle="Download your data">
 *   <ExportForm />
 * </SectionPanel>
 *
 * // Non-collapsible panel without icon
 * <SectionPanel title="Clinic Settings">
 *   <SettingsForm />
 * </SectionPanel>
 *
 * // Collapsible panel with header controls
 * <SectionPanel
 *   icon={<Settings />}
 *   title="Pump Settings"
 *   collapsible
 *   defaultExpanded
 *   headerControls={<BgUnitsToggle />}
 * >
 *   <SettingsContent />
 * </SectionPanel>
 * ```
 */
export default function SectionPanel({
  icon,
  title,
  subtitle,
  children,
  headerControls,
  collapsible = false,
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = true,
  'aria-label': ariaLabel,
}: SectionPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = collapsible
    ? controlledExpanded !== undefined
      ? controlledExpanded
      : internalExpanded
    : true; // Always expanded if not collapsible

  const handleToggle = () => {
    if (!collapsible) return;

    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const panelId = `${title.toLowerCase().replace(/\s+/g, '-')}-panel-content`;

  const headerContent = (
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-2 items-center">
        {icon}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-default-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {headerControls}
        {collapsible && (
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="w-full rounded-lg border-2 border-content2 overflow-hidden"
      aria-label={ariaLabel}
    >
      {collapsible ? (
        <button
          className="flex w-full p-4 bg-content1 hover:bg-default/40 transition-colors cursor-pointer"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
        >
          {headerContent}
        </button>
      ) : (
        <div className="flex w-full p-4 bg-content1">{headerContent}</div>
      )}

      {isExpanded && (
        <div id={panelId} className="p-4 transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
