import { type ReactNode } from 'react';
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
  /** Heading level to use (defaults to 'h3') */
  headingLevel?: 'h2' | 'h3' | 'h4';
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
  headingLevel: Heading = 'h3',
}: DangerZoneSectionProps) {
  const headerClasses = {
    sm: 'text-sm font-semibold',
    lg: 'text-lg font-medium',
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-[color:var(--danger)] mb-4">
        {showIcon && <AlertTriangle size={18} aria-hidden="true" />}
        <Heading className={headerClasses[size]}>{title}</Heading>
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
    <ActionCard
      title={title}
      description={description}
      actionButton={actionButton}
      borderColor="border-danger"
    />
  );
}

export type ActionCardProps = {
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** The action button element */
  actionButton: ReactNode;
  /** Border color class (default: border-default) */
  borderColor?: string;
};

/**
 * A generic action card with title, description, and action button.
 *
 * @example
 * <ActionCard
 *   title="Send Password Reset"
 *   description="Send a password reset email to this user."
 *   actionButton={<Button color="primary" variant="flat" size="sm">Send Reset</Button>}
 * />
 */
export function ActionCard({
  title,
  description,
  actionButton,
  borderColor = 'border-default',
}: ActionCardProps) {
  const dividerCls =
    borderColor === 'border-danger'
      ? 'border-[var(--danger-border)]'
      : 'border-[color:var(--border)]';
  const undoPhrase = 'This action cannot be undone.';
  const descIdx =
    typeof description === 'string' ? description.indexOf(undoPhrase) : -1;
  const descNode =
    descIdx >= 0 && typeof description === 'string' ? (
      <>
        {description.slice(0, descIdx)}
        <span className="font-semibold text-[var(--danger-soft-fg)]">
          {undoPhrase}
        </span>
        {description.slice(descIdx + undoPhrase.length)}
      </>
    ) : (
      description
    );
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 border-t ${dividerCls} first:border-t-0 first:pt-0`}
    >
      <div>
        <p className="text-sm font-semibold text-[color:var(--text-heading)]">
          {title}
        </p>
        <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
          {descNode}
        </p>
      </div>
      {actionButton}
    </div>
  );
}
