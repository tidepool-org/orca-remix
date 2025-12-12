import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export type DangerZoneSectionProps = {
  /** Section title (defaults to "Danger Zone") */
  title?: string;
  /** Whether to show the AlertTriangle icon */
  showIcon?: boolean;
  /** Section content - typically danger action buttons */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Header size variant */
  size?: 'sm' | 'lg';
};

/**
 * A reusable danger zone section for destructive actions.
 * Displays a danger-colored header with optional icon and children content.
 *
 * @example
 * // Simple usage with icon (UserActions style)
 * <DangerZoneSection showIcon size="sm">
 *   <div className="flex flex-wrap gap-2">
 *     <Button color="danger" variant="flat">Delete Data</Button>
 *     <Button color="danger" variant="flat">Delete Account</Button>
 *   </div>
 * </DangerZoneSection>
 *
 * @example
 * // Without icon (ClinicProfile style)
 * <DangerZoneSection>
 *   <DangerZoneAction
 *     title="Delete Clinic"
 *     description="Permanently delete this clinic."
 *     actionButton={<Button color="danger">Delete</Button>}
 *   />
 * </DangerZoneSection>
 */
export default function DangerZoneSection({
  title = 'Danger Zone',
  showIcon = false,
  children,
  className = '',
  size = 'lg',
}: DangerZoneSectionProps) {
  const headerClasses = {
    sm: 'text-sm font-semibold',
    lg: 'text-lg font-medium',
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-danger mb-4">
        {showIcon && <AlertTriangle size={18} aria-hidden="true" />}
        <h3 className={headerClasses[size]}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export type DangerZoneActionProps = {
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** The action button element */
  actionButton: ReactNode;
};

/**
 * A single action item within a DangerZoneSection.
 * Displays a bordered card with title, description, and action button.
 *
 * @example
 * <DangerZoneAction
 *   title="Delete Clinic Workspace"
 *   description="Permanently delete this clinic and all associated data. This action cannot be undone."
 *   actionButton={
 *     <Button color="danger" variant="flat" size="sm" startContent={<Trash2 size={14} />}>
 *       Delete Clinic
 *     </Button>
 *   }
 * />
 */
export function DangerZoneAction({
  title,
  description,
  actionButton,
}: DangerZoneActionProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-danger rounded-lg">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-default-500">{description}</p>
      </div>
      {actionButton}
    </div>
  );
}
