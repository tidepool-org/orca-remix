/**
 * Shared HeroUI Button hairline borders for the secondary and in-context-
 * destructive roles, derived from the visual-reference `.btn-soft` and
 * `.btn-danger-soft` tokens in `handoff/visual-reference/skins.css:365-370`.
 *
 * Secondary (flat indigo) and in-context-destructive (flat red) buttons must
 * read as siblings — same soft-tint + hairline structure, differing only in
 * hue. HeroUI's `variant="flat"` renders one hue bordered and the other not,
 * so these constants add the missing hairline for parity. The reference's
 * palest tokens (`--primary` 24% / `--danger-border`) wash out against the
 * soft fill, so the hairline is mixed at 40% of its hue to stay visible in
 * both themes. Apply via a Button `className` alongside
 * `color="primary" variant="flat"` (secondary) or
 * `color="danger" variant="flat"` (in-context destructive).
 */
export const secondaryButtonClassName =
  'border border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]';

export const dangerRowButtonClassName =
  'border border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)]';

/**
 * Neutral tertiary (Reset / "set default") — a grey-filled button with a
 * hairline border, matching the visual-reference `.btn-ghost` token
 * (`background: var(--surface-2); border: 1px solid var(--border)`). Fills a
 * touch darker on hover. Apply via a Button `className` (pair with
 * `variant="flat"` so no color tint fights the neutral surface).
 */
export const tertiaryButtonClassName =
  'bg-[color:var(--surface-2)] border border-[color:var(--border)] data-[hover=true]:bg-[color:var(--surface-3)]';
