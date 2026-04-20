import type { LucideIcon } from 'lucide-react';

type TabTitleProps = {
  /**
   * Icon component to display
   */
  icon: LucideIcon;
  /**
   * Tab label text
   */
  label: string;
  /**
   * Optional count to display in badge
   */
  count?: number;
  /**
   * Whether to show the badge (defaults to showing when count > 0)
   */
  showBadge?: boolean;
};

/**
 * Standardized tab title with icon and optional count badge.
 * Use as the `title` prop for HeroUI Tab components.
 *
 * @example
 * // Basic usage
 * <Tab key="data" title={<TabTitle icon={Database} label="Data" />}>
 *   <DataContent />
 * </Tab>
 *
 * @example
 * // With count badge
 * <Tab key="patients" title={<TabTitle icon={Users} label="Patients" count={25} />}>
 *   <PatientsContent />
 * </Tab>
 *
 * @example
 * // Force show badge even with zero count
 * <Tab key="items" title={<TabTitle icon={Box} label="Items" count={0} showBadge />}>
 *   <ItemsContent />
 * </Tab>
 */
export default function TabTitle({
  icon: Icon,
  label,
  count,
  showBadge,
}: TabTitleProps) {
  // Show badge if explicitly requested, or if count is greater than 0
  const shouldShowBadge =
    showBadge !== undefined ? showBadge : count !== undefined && count > 0;

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
      {shouldShowBadge && count !== undefined && (
        <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
