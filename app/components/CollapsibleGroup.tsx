import { createContext, useContext, ReactNode } from 'react';

type CollapsibleGroupContextType = {
  defaultExpanded: boolean;
};

const CollapsibleGroupContext =
  createContext<CollapsibleGroupContextType | null>(null);

export type CollapsibleGroupProps = {
  children: ReactNode;
  /** Whether the first collapsible should be expanded by default. Defaults to true. */
  defaultExpanded?: boolean;
};

/**
 * CollapsibleGroup provides context for child CollapsibleTableWrapper components
 * to determine if they should be expanded by default when using the `isFirstInGroup` prop.
 *
 * Usage:
 * ```tsx
 * <CollapsibleGroup>
 *   <SomeTable isFirstInGroup />  // Will be expanded by default
 *   <AnotherTable />              // Will be collapsed by default
 *   <YetAnotherTable />           // Will be collapsed by default
 * </CollapsibleGroup>
 * ```
 */
export function CollapsibleGroup({
  children,
  defaultExpanded = true,
}: CollapsibleGroupProps) {
  return (
    <CollapsibleGroupContext.Provider value={{ defaultExpanded }}>
      {children}
    </CollapsibleGroupContext.Provider>
  );
}

/**
 * Hook for CollapsibleTableWrapper to get the group's default expanded setting.
 * Returns the defaultExpanded value from the nearest CollapsibleGroup, or false if not in a group.
 */
export function useCollapsibleGroup(): boolean {
  const context = useContext(CollapsibleGroupContext);
  return context?.defaultExpanded ?? false;
}
