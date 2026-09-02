/**
 * Reusable form-field styling constants — the shared look for every text
 * input, select, and dropdown across the app. Companion to the per-concern
 * style modules (`tableStyles`, `buttonStyles`, `iconButtonStyles`,
 * `chipStyles`). Tokens map to `handoff/visual-reference/skins.css`
 * `.input, .select`.
 */

/**
 * Shared field-box surface — the one input/select/dropdown look
 * (tinted --field-bg fill, 1px --field-border, no shadow, 40px tall).
 * Maps to skins.css `.input, .select`; height standardized at 40px.
 * Apply to the relevant HeroUI slot: `inputWrapper` for Input/Autocomplete,
 * `trigger` for Select, or a Dropdown Button `className`.
 */
export const fieldSurfaceClasses =
  'h-10 min-h-10 bg-[color:var(--field-bg)] border border-[color:var(--field-border)] shadow-none';

export const searchInputClasses = {
  base: 'max-w-xs',
  inputWrapper: fieldSurfaceClasses,
  input: 'group-data-[has-value=true]:text-[color:var(--text)]',
};

/**
 * Neutral listbox-item styling for the field dropdowns (Select / Autocomplete /
 * Dropdown menus). HeroUI's default highlights the focused/selected option with
 * an indigo focus ring, which reads as out-of-place against the neutral field
 * family; this replaces it with a soft neutral surface highlight + neutral
 * focus outline. Pass to `listboxProps={{ itemClasses: fieldMenuItemClasses }}`
 * (Select/Autocomplete) or `itemClasses={fieldMenuItemClasses}` (DropdownMenu).
 */
export const fieldMenuItemClasses = {
  base: [
    'data-[hover=true]:bg-[color:var(--surface-2)]',
    'data-[focus=true]:bg-[color:var(--surface-2)]',
    'data-[selectable=true]:focus:bg-[color:var(--surface-2)]',
    'data-[selected=true]:bg-[color:var(--surface-2)]',
    'data-[focus-visible=true]:outline-[color:var(--field-border)]',
  ].join(' '),
};
