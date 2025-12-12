import { Button, Tooltip } from '@heroui/react';
import { Trash2, type LucideIcon } from 'lucide-react';

type DeleteActionButtonProps = {
  /**
   * Tooltip text shown on hover
   */
  tooltip: string;
  /**
   * Aria label for accessibility
   */
  ariaLabel: string;
  /**
   * Callback when button is pressed
   */
  onPress: () => void;
  /**
   * Whether the button is disabled
   */
  isDisabled?: boolean;
  /**
   * Icon to display (defaults to Trash2)
   */
  icon?: LucideIcon;
  /**
   * Icon size in pixels (default: 16)
   */
  iconSize?: number;
  /**
   * Button size (default: sm)
   */
  size?: 'sm' | 'md' | 'lg';
};

/**
 * A reusable destructive action button with tooltip for table actions.
 * Used for delete, remove, revoke, and similar destructive actions.
 *
 * @example
 * // Basic usage
 * <DeleteActionButton
 *   tooltip="Remove clinician"
 *   ariaLabel="Remove clinician"
 *   onPress={() => handleRemove(item)}
 * />
 *
 * @example
 * // With custom icon
 * <DeleteActionButton
 *   tooltip="Revoke invitation"
 *   ariaLabel="Revoke invitation"
 *   onPress={() => handleRevoke(invite)}
 *   icon={X}
 *   isDisabled={!canRevoke}
 * />
 */
export default function DeleteActionButton({
  tooltip,
  ariaLabel,
  onPress,
  isDisabled = false,
  icon: Icon = Trash2,
  iconSize = 16,
  size = 'sm',
}: DeleteActionButtonProps) {
  return (
    <Tooltip content={tooltip} color="danger">
      <Button
        isIconOnly
        size={size}
        color="danger"
        variant="light"
        onPress={onPress}
        aria-label={ariaLabel}
        isDisabled={isDisabled}
      >
        <Icon size={iconSize} aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}
