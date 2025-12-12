import { Tabs } from '@heroui/react';
import type { ReactNode } from 'react';

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
   * Default selected tab key
   */
  defaultSelectedKey?: string;
  /**
   * Additional className for the tabs container
   */
  className?: string;
};

/**
 * Standardized tabs wrapper for profile pages with consistent styling.
 * Use with HeroUI Tab components as children.
 *
 * @example
 * <ProfileTabs aria-label="User profile sections">
 *   <Tab key="data" title={<TabTitle icon={Database} label="Data" count={10} />}>
 *     <DataContent />
 *   </Tab>
 *   <Tab key="settings" title={<TabTitle icon={Settings} label="Settings" />}>
 *     <SettingsContent />
 *   </Tab>
 * </ProfileTabs>
 */
export default function ProfileTabs({
  'aria-label': ariaLabel,
  children,
  defaultSelectedKey,
  className,
}: ProfileTabsProps) {
  return (
    <Tabs
      aria-label={ariaLabel}
      variant="underlined"
      defaultSelectedKey={defaultSelectedKey}
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
