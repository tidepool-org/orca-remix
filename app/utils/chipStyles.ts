import type { ChipColor } from '~/utils/statusColors';

/**
 * Shared HeroUI Chip `classNames` slot overrides matching the visual-reference
 * `.chip` tokens from `handoff/visual-reference/skins.css`:
 *
 *   .chip          { height:21px; padding:0 9px; border-radius:5px;
 *                    font-family:'IBM Plex Mono'; font-size:10.5px; font-weight:500;
 *                    background:var(--chip-bg); color:var(--chip-fg); }
 *   .chip-amber    { background:var(--warn-bg);  color:var(--warn); }
 *   .chip-neutral  { background:var(--surface-3); color:var(--text-muted); }
 *
 * `chipClassNames` (shape only) is kept for callers that don't drive a solid
 * fill. Prefer `getChipClassNames(color)`, which adds the reference solid fill
 * for the chip's HeroUI semantic color instead of HeroUI's flat `/20` tint.
 * Fills are CSS-var driven, so they re-theme automatically in dark mode.
 */
const shapeBase = '!h-[21px] !min-h-[21px] !px-[9px] !rounded-[5px] !gap-1';
const content =
  '!font-mono !text-[10.5px] !font-medium !leading-none !px-0 !tracking-normal';

/**
 * Reference solid-fill mapping per HeroUI semantic color. `!` modifiers win
 * over HeroUI's flat-variant `bg-{color}/20` + `text-{color}` defaults.
 * - primary           → `.chip` brand tokens
 * - default/secondary → `.chip-neutral`
 * - warning           → `.chip-amber`
 * - danger            → danger-soft pair
 * - success           → soft mix of `--ok` (reference defines no `.chip.good`)
 */
const fillByColor: Record<ChipColor, string> = {
  default: '!bg-[color:var(--surface-3)] !text-[color:var(--text-muted)]',
  secondary: '!bg-[color:var(--surface-3)] !text-[color:var(--text-muted)]',
  primary: '!bg-[color:var(--chip-bg)] !text-[color:var(--chip-fg)]',
  warning: '!bg-[color:var(--warn-bg)] !text-[color:var(--warn)]',
  success:
    '!bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] !text-[color:var(--ok)]',
  danger: '!bg-[color:var(--danger-soft)] !text-[color:var(--danger-soft-fg)]',
};

/** Shape-only chip overrides (no fill). */
export const chipClassNames = {
  base: shapeBase,
  content,
} as const;

/** Shape + reference solid fill for the chip's HeroUI semantic color. */
export function getChipClassNames(color: ChipColor = 'default') {
  return {
    base: `${shapeBase} ${fillByColor[color]}`,
    content,
  };
}
