/**
 * Reusable table styling constants
 */

export const recentTableClasses = {
  base: 'flex flex-1 flex-col text-content1-foreground gap-4',
  th: 'bg-content1',
  tr: 'data-[hover=true]:cursor-pointer',
};

export const searchInputClasses = {
  base: 'max-w-xs',
  inputWrapper: 'lightTheme:bg-background',
  input: 'group-data-[has-value=true]:text-content1-foreground',
};

/**
 * Standard table classes for collapsible tables
 * No background on headers for consistency
 */
export const collapsibleTableClasses = {
  wrapper: 'shadow-none',
  base: 'flex flex-1 flex-col text-content1-foreground gap-4',
  tr: 'data-[hover=true]:cursor-pointer',
};
