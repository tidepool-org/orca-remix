import { Tabs } from '@heroui/react';
import type { Key, ReactNode } from 'react';

type ProfileTabsProps = {
  /**
   * Accessible label for the tabs
   */
  'aria-label': string;
  /**
   * Tab components to render
   */
  children: ReactNode;
  /**
   * Default selected tab key (uncontrolled mode)
   */
  defaultSelectedKey?: string;
  /**
   * Selected tab key (controlled mode)
   */
  selectedKey?: string;
  /**
   * Callback when selection changes (controlled mode)
   */
  onSelectionChange?: (key: Key) => void;
  /**
   * Additional className for the tabs container
   */
  className?: string;
};

/**
 * Standardized tabs wrapper for profile pages with consistent styling.
 * Use with HeroUI Tab components as children.
 *
 * Supports both controlled and uncontrolled modes:
 * - Uncontrolled: use `defaultSelectedKey`
 * - Controlled: use `selectedKey` and `onSelectionChange`
 *
 * @example
 * // Uncontrolled
 * <ProfileTabs aria-label="User profile sections" defaultSelectedKey="data">
 *   <Tab key="data" title={<TabTitle icon={Database} label="Data" count={10} />}>
 *     <DataContent />
 *   </Tab>
 * </ProfileTabs>
 *
 * // Controlled (with URL state)
 * <ProfileTabs
 *   aria-label="User profile sections"
 *   selectedKey={currentTab}
 *   onSelectionChange={(key) => setCurrentTab(key as string)}
 * >
 *   <Tab key="data" title={<TabTitle icon={Database} label="Data" count={10} />}>
 *     <DataContent />
 *   </Tab>
 * </ProfileTabs>
 */
export default function ProfileTabs({
  'aria-label': ariaLabel,
  children,
  defaultSelectedKey,
  selectedKey,
  onSelectionChange,
  className,
}: ProfileTabsProps) {
  return (
    <Tabs
      aria-label={ariaLabel}
      variant="underlined"
      defaultSelectedKey={defaultSelectedKey}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      className={className}
      classNames={{
        tabList:
          'gap-4 w-full relative rounded-none p-0 border-b border-divider',
        cursor: 'w-full bg-primary',
        tab: 'max-w-fit px-2 h-12',
        tabContent: 'group-data-[selected=true]:text-primary',
      }}
    >
      {children}
    </Tabs>
  );
}
