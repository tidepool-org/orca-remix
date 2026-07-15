import { ReactNode } from 'react';
import ClipboardButton from './ClipboardButton';

export type CopyableIdentifierProps = {
  /** Optional label displayed before the value (e.g., "ID:", "Email:") */
  label?: string;
  /** The value to display and copy */
  value: string;
  /** Whether to display the value in monospace font (default: true if label provided, false otherwise) */
  monospace?: boolean;
  /** Whether to truncate long values with ellipsis */
  truncate?: boolean;
  /** Maximum width for truncation (e.g., "120px", "200px") */
  maxWidth?: string;
  /** Custom content to display instead of the value text (value is still copied) */
  children?: ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** Size variant for the component */
  size?: 'sm' | 'md';
};

/**
 * A reusable component for displaying copyable identifiers (IDs, emails, etc.)
 * with an integrated clipboard button.
 *
 * @example
 * // Simple usage
 * <CopyableIdentifier value="user@example.com" />
 *
 * @example
 * // With label
 * <CopyableIdentifier label="Email:" value="user@example.com" />
 *
 * @example
 * // Truncated ID
 * <CopyableIdentifier
 *   value="abc123def456ghi789"
 *   truncate
 *   maxWidth="120px"
 *   monospace
 * />
 *
 * @example
 * // With custom child content (link)
 * <CopyableIdentifier value={userId}>
 *   <Link to={`/users/${userId}`}>{userId}</Link>
 * </CopyableIdentifier>
 */
export default function CopyableIdentifier({
  label,
  value,
  monospace,
  truncate = false,
  maxWidth = '120px',
  children,
  className = '',
  size = 'md',
}: CopyableIdentifierProps) {
  if (!value) return null;

  // Default monospace to true if a label is provided (follows existing ProfileHeader pattern)
  const useMonospace = monospace ?? !!label;

  // Reference design renders labels without a trailing colon ("ID 624..." not "ID: 624...").
  // Strip any trailing colon defensively so callers can keep grammatical label props.
  const displayLabel = label?.replace(/:\s*$/, '');

  // `md` inherits the surrounding text size (no explicit class). Previously
  // this used `text-md`, which isn't a defined Tailwind/theme token and so was
  // a silent no-op; the empty string keeps the same rendering while removing
  // the misleading dead class.
  const sizeClasses = {
    sm: 'text-base',
    md: '',
  };

  const valueClasses = [
    useMonospace ? `font-mono ${sizeClasses[size]}` : sizeClasses[size],
    // In truncate mode the value shrinks (min-w-0) and ellipsizes inside a
    // fixed-layout cell, but does NOT grow to fill it — so the copy icon stays
    // flush against the text (matching non-truncated cells) rather than being
    // pushed to the cell's right edge.
    truncate ? 'truncate min-w-0' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={`${truncate ? 'flex w-full min-w-0' : 'inline-flex'} items-center gap-1.5 group text-[color:var(--text-muted)] ${className}`.trim()}
    >
      {displayLabel && (
        <span className="text-[color:var(--text-faint)] uppercase tracking-wide text-[10.5px] font-semibold">
          {displayLabel}
        </span>
      )}
      {children ? (
        children
      ) : (
        <span
          className={valueClasses}
          style={truncate ? { maxWidth } : undefined}
          title={truncate ? value : undefined}
        >
          {value}
        </span>
      )}
      <ClipboardButton clipboardText={value} size={size} />
    </span>
  );
}
