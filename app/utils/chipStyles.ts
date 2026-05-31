/**
 * Shared HeroUI Chip `classNames` slot overrides matching the visual-reference
 * `.chip` token from `handoff/visual-reference/skins.css`:
 *
 *   .chip {
 *     display: inline-flex;
 *     align-items: center;
 *     gap: 4px;
 *     padding: 0 9px;
 *     height: 21px;
 *     border-radius: 5px;
 *     font-family: 'IBM Plex Mono';
 *     font-size: 10.5px;
 *     font-weight: 500;
 *   }
 *
 * Pass to any `<Chip>` via `classNames={chipClassNames}`. Merges with HeroUI
 * defaults via tailwind-merge; the `!` modifiers win over HeroUI's own
 * `h-*` / `px-*` / `rounded-*` defaults for the `size="sm"` variant.
 */
export const chipClassNames = {
  base: '!h-[21px] !min-h-[21px] !px-[9px] !rounded-[5px] !gap-1',
  content:
    '!font-mono !text-[10.5px] !font-medium !leading-none !px-0 !tracking-normal',
} as const;
