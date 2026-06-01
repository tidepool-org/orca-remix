/**
 * Reusable table styling constants
 * Tokens map 1:1 to handoff/visual-reference/skins.css `.tbl` rules
 * (10.5px tracked-uppercase th, 40px row height, subtle 55% surface-2 zebra,
 * primary-soft hover, top-border per row).
 */

const sharedTh =
  'bg-[color:var(--surface-2)] text-[color:var(--text-faint)] uppercase tracking-[0.07em] text-[10.5px] font-semibold py-[9px] px-3 !rounded-none border-b border-[color:var(--border)]';
const sharedTd =
  'px-3 h-[40px] py-0 text-[13px] text-[color:var(--text)] border-t border-[color:var(--border)]';
const sharedTr = [
  'transition-colors',
  'data-[hover=true]:cursor-pointer',
  'data-[hover=true]:bg-[color:var(--primary-soft)]',
  // Zebra matches `skins.css:589-591` `.tbl tbody tr:nth-child(even)`.
  // Tailwind's `/55` opacity modifier does not compile against an arbitrary
  // CSS-var color, so the rule is expressed inline via color-mix.
  'even:bg-[color-mix(in_srgb,var(--surface-2)_55%,transparent)]',
].join(' ');

export const recentTableClasses = {
  base: 'flex flex-1 flex-col text-[color:var(--text)] gap-4',
  th: sharedTh,
  td: sharedTd,
  tr: sharedTr,
};

export const searchInputClasses = {
  base: 'max-w-xs',
  inputWrapper:
    'bg-[color:var(--field-bg)] border border-[color:var(--field-border)] shadow-none',
  input: 'group-data-[has-value=true]:text-[color:var(--text)]',
};

/**
 * Standard table classes for collapsible tables
 */
export const collapsibleTableClasses = {
  wrapper: 'shadow-none',
  base: 'flex flex-1 flex-col text-[color:var(--text)] gap-4',
  th: sharedTh,
  td: sharedTd,
  tr: sharedTr,
};

/** Standard className for TableColumn headers */
export const columnClass = 'text-left';

/** className for right-aligned Actions columns */
export const actionsColumnClass = 'text-right';
