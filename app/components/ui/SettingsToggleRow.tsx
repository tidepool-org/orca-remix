import { Switch } from '@heroui/react';

export type SettingsToggleRowProps = {
  /** Main label/title for the setting */
  label: string;
  /** Description text below the label */
  description?: string;
  /** Current toggle state */
  isSelected: boolean;
  /** Callback when toggle value changes */
  onValueChange: (value: boolean) => void;
  /** Whether the toggle is disabled */
  isDisabled?: boolean;
  /** Aria label for the switch (defaults to label) */
  ariaLabel?: string;
  /** Visual variant for the row */
  variant?: 'default' | 'card';
  /** Switch size */
  size?: 'sm' | 'md' | 'lg';
};

/**
 * A reusable settings toggle row with label, description, and switch.
 * Used for boolean settings in profile and settings pages.
 *
 * @example
 * // Default variant (no background)
 * <SettingsToggleRow
 *   label="MRN Required"
 *   description="Require MRN when creating patients"
 *   isSelected={mrnRequired}
 *   onValueChange={setMrnRequired}
 * />
 *
 * @example
 * // Card variant (with background)
 * <SettingsToggleRow
 *   label="Clinic Admin"
 *   description="Admin users can manage clinic settings"
 *   isSelected={isAdmin}
 *   onValueChange={handleAdminToggle}
 *   variant="card"
 * />
 */
export default function SettingsToggleRow({
  label,
  description,
  isSelected,
  onValueChange,
  isDisabled = false,
  ariaLabel,
  variant = 'default',
  size = 'sm',
}: SettingsToggleRowProps) {
  const variantClasses = {
    default: 'flex items-center justify-between',
    card: 'flex items-center justify-between p-4 bg-content2 rounded-lg',
  };

  return (
    <div className={variantClasses[variant]}>
      <div className={description ? 'flex flex-col gap-1' : ''}>
        <span
          className={variant === 'card' ? 'font-medium' : 'text-sm font-medium'}
        >
          {label}
        </span>
        {description && (
          <span className="text-xs text-default-500">{description}</span>
        )}
      </div>
      <Switch
        isSelected={isSelected}
        onValueChange={onValueChange}
        isDisabled={isDisabled}
        size={size}
        aria-label={ariaLabel || label}
      />
    </div>
  );
}
