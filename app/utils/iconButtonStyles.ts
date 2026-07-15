/**
 * Shared HeroUI Button `classNames` slot overrides for icon-only action
 * buttons in tables, matching the visual-reference `.icon-btn` token from
 * `handoff/visual-reference/skins.css:290-307`:
 *
 *   .icon-btn {
 *     width: 34px;
 *     height: 34px;
 *     border-radius: 7px;
 *     display: grid;
 *     place-items: center;
 *     color: var(--text-muted);
 *     border: 1px solid transparent;
 *     transition: 0.14s;
 *   }
 *   .icon-btn:hover {
 *     background: var(--surface-3);
 *     color: var(--text);
 *   }
 *   .icon-btn svg {
 *     width: 18px;
 *     height: 18px;
 *   }
 *
 * Apply to any icon-only `<Button isIconOnly>` via
 * `classNames={iconButtonClassNames}`. `!` modifiers win over HeroUI's
 * `size="sm"` defaults.
 *
 * Color semantics are preserved by HeroUI's `color` prop — destructive
 * actions still pass `color="danger"` and inherit the danger text token
 * on hover via the `data-[hover=true]` rule below.
 */
export const iconButtonClassName =
  '!w-[34px] !h-[34px] !min-w-[34px] !min-h-[34px] !rounded-[7px] !p-0 ' +
  'grid place-items-center border border-transparent ' +
  '!bg-transparent data-[hover=true]:!bg-[color:var(--surface-3)] ' +
  'transition-colors';

/**
 * Back-compat object form for components whose props expose `classNames`
 * (e.g. HeroUI `<Chip>` / `<Input>`). HeroUI `<Button>` only exposes
 * `className`, so use {@link iconButtonClassName} for buttons.
 */
export const iconButtonClassNames = {
  base: iconButtonClassName,
} as const;

/** Default icon size for in-table action icons, matching `.icon-btn svg` (18px). */
export const iconButtonIconSize = 18;
