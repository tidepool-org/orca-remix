import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SectionPanelProps = {
  /** Icon to display in the header (optional) */
  icon?: ReactNode;
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Content to render inside the panel (optional for header-only panels) */
  children?: ReactNode;
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
  /** Additional className for the title text */
  titleClassName?: string;
  /** Visual tone for the panel header (default 'default') */
  tone?: 'default' | 'danger';
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
  titleClassName,
  tone = 'default',
  'aria-label': ariaLabel,
}: SectionPanelProps) {
  const toneCls =
    tone === 'danger'
      ? {
          container:
            'border-[color:var(--danger-border,theme(colors.danger.200))] bg-[color:var(--surface)]',
          header:
            'bg-[color:var(--danger-soft,theme(colors.danger.50))] border-b border-[color:var(--danger-border,theme(colors.danger.200))]',
        }
      : {
          container:
            'border-[color:var(--border)] bg-[color:var(--surface)] shadow-token',
          header:
            'bg-[color:var(--surface-2)] border-b border-[color:var(--border)]',
        };

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

  const panelId = useId();
  const headingId = useId();

  const titleContent = (
    <>
      {icon ? (
        <span
          className="inline-grid place-items-center w-[22px] h-[22px] flex-none text-[color:var(--primary)] [&_svg]:w-4 [&_svg]:h-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col">
        <span
          id={headingId}
          role="heading"
          aria-level={2}
          className={`text-[12.5px] font-semibold uppercase tracking-[0.07em] text-[color:var(--text-heading)] whitespace-nowrap ${titleClassName || ''}`}
        >
          {title}
        </span>
        {subtitle && (
          <p className="text-[12px] text-[color:var(--text-muted)] mt-0.5 normal-case tracking-normal font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </>
  );

  const headerContent = (
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-[10px] items-center">{titleContent}</div>
      <div className="flex items-center gap-[10px]">
        {headerControls}
        {collapsible && (
          <ChevronDown
            className={`w-4 h-4 text-[color:var(--text-faint)] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  return (
    <section
      className={`w-full rounded-[8px] border ${toneCls.container} overflow-hidden`}
      aria-label={ariaLabel}
    >
      {collapsible ? (
        <button
          className={`flex w-full px-4 py-2.5 min-h-[43px] ${toneCls.header} hover:brightness-[0.98] transition-colors cursor-pointer`}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-labelledby={headingId}
        >
          {headerContent}
        </button>
      ) : (
        <div
          className={`flex w-full px-4 py-2.5 min-h-[43px] items-center ${toneCls.header}`}
        >
          {headerContent}
        </div>
      )}

      {children && (
        <div
          id={panelId}
          className="p-4 transition-all duration-300"
          hidden={!isExpanded}
        >
          {children}
        </div>
      )}
    </section>
  );
}
