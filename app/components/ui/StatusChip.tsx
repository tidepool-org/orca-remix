import { Chip } from '@heroui/react';
import {
  getStatusColor,
  getPrescriptionStateColor,
  getInviteStatusColor,
  getDataSourceStateColor,
  getRoleColor,
  formatRoleLabel,
  type ChipColor,
} from '~/utils/statusColors';

type StatusType = 'prescription' | 'invite' | 'dataSource' | 'role';

type StatusChipProps = {
  /**
   * The status value to display
   */
  status: string;
  /**
   * The type of status, determines color mapping
   */
  type: StatusType;
  /**
   * Optional custom color map to override default colors
   */
  colorMap?: Record<string, ChipColor>;
  /**
   * Chip size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Chip variant style
   */
  variant?:
    | 'solid'
    | 'bordered'
    | 'light'
    | 'flat'
    | 'faded'
    | 'shadow'
    | 'dot';
  /**
   * Custom display label (defaults to formatted status)
   */
  label?: string;
  /**
   * Whether to capitalize the label
   */
  capitalize?: boolean;
  /**
   * Additional className
   */
  className?: string;
};

/**
 * Standardized status chip with automatic color mapping based on status type.
 *
 * @example
 * // Prescription state
 * <StatusChip status="active" type="prescription" />
 *
 * @example
 * // Invite status
 * <StatusChip status="pending" type="invite" />
 *
 * @example
 * // Clinician role
 * <StatusChip status="CLINIC_ADMIN" type="role" />
 *
 * @example
 * // Custom color map
 * <StatusChip
 *   status="custom"
 *   type="prescription"
 *   colorMap={{ custom: 'secondary' }}
 * />
 */
export default function StatusChip({
  status,
  type,
  colorMap,
  size = 'sm',
  variant = 'flat',
  label,
  capitalize = true,
  className,
}: StatusChipProps) {
  // Get color from custom map or default based on type
  const getColor = (): ChipColor => {
    if (colorMap && status?.toLowerCase() in colorMap) {
      return colorMap[status.toLowerCase()];
    }

    switch (type) {
      case 'prescription':
        return getPrescriptionStateColor(status);
      case 'invite':
        return getInviteStatusColor(status);
      case 'dataSource':
        return getDataSourceStateColor(status);
      case 'role':
        return getRoleColor(status);
      default:
        return getStatusColor(status, type);
    }
  };

  // Get display label
  const getLabel = (): string => {
    if (label) return label;
    if (type === 'role') return formatRoleLabel(status);
    return status;
  };

  return (
    <Chip
      color={getColor()}
      variant={variant}
      size={size}
      className={`${capitalize ? 'capitalize' : ''} ${className ?? ''}`}
    >
      {getLabel()}
    </Chip>
  );
}
