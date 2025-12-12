import { ReactNode } from 'react';
import ClipboardButton from '../ClipboardButton';

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
  // Default monospace to true if a label is provided (follows existing ProfileHeader pattern)
  const useMonospace = monospace ?? !!label;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  const valueClasses = [
    useMonospace ? 'font-mono text-xs' : sizeClasses[size],
    truncate ? 'truncate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={`flex items-center gap-1 text-default-500 ${className}`.trim()}
    >
      {label && <span className="text-default-400">{label}</span>}
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
      <ClipboardButton clipboardText={value} />
    </span>
  );
}
