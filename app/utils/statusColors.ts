/**
 * HeroUI Chip color type
 */
export type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Color mapping for prescription states
 */
export const prescriptionStateColors: Record<string, ChipColor> = {
  active: 'success',
  claimed: 'success',
  submitted: 'primary',
  pending: 'warning',
  draft: 'default',
  inactive: 'secondary',
  expired: 'danger',
};

/**
 * Color mapping for invite statuses
 */
export const inviteStatusColors: Record<string, ChipColor> = {
  pending: 'warning',
  accepted: 'success',
  completed: 'success',
  declined: 'danger',
  canceled: 'default',
  expired: 'danger',
};

/**
 * Color mapping for data source states
 */
export const dataSourceStateColors: Record<string, ChipColor> = {
  connected: 'success',
  disconnected: 'danger',
  error: 'danger',
};

/**
 * Color mapping for clinician roles
 */
export const roleColors: Record<string, ChipColor> = {
  clinic_admin: 'primary',
  prescriber: 'success',
  clinic_member: 'default',
};

/**
 * Get prescription state color
 */
export function getPrescriptionStateColor(
  state: string | undefined | null,
): ChipColor {
  return prescriptionStateColors[state?.toLowerCase() ?? ''] ?? 'default';
}

/**
 * Get invite status color
 */
export function getInviteStatusColor(
  status: string | undefined | null,
): ChipColor {
  return inviteStatusColors[status?.toLowerCase() ?? ''] ?? 'default';
}

/**
 * Get data source state color
 */
export function getDataSourceStateColor(
  state: string | undefined | null,
): ChipColor {
  return dataSourceStateColors[state?.toLowerCase() ?? ''] ?? 'default';
}

/**
 * Get role color
 */
export function getRoleColor(role: string | undefined | null): ChipColor {
  return roleColors[role?.toLowerCase() ?? ''] ?? 'default';
}

/**
 * Generic status color getter supporting multiple types
 */
export function getStatusColor(
  status: string | undefined | null,
  type: 'prescription' | 'invite' | 'dataSource' | 'role',
): ChipColor {
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
      return 'default';
  }
}

/**
 * Format role label for display
 */
export function formatRoleLabel(role: string | undefined | null): string {
  switch (role?.toLowerCase()) {
    case 'clinic_admin':
      return 'Admin';
    case 'clinic_member':
      return 'Member';
    case 'prescriber':
      return 'Prescriber';
    default:
      return role?.replace('CLINIC_', '').toLowerCase() ?? '';
  }
}
