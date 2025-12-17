import { describe, it, expect } from 'vitest';
import {
  getPrescriptionStateColor,
  getInviteStatusColor,
  getDataSourceStateColor,
  getRoleColor,
  getStatusColor,
  formatRoleLabel,
  prescriptionStateColors,
  inviteStatusColors,
  dataSourceStateColors,
  roleColors,
} from './statusColors';

describe('statusColors', () => {
  describe('getPrescriptionStateColor', () => {
    it('returns success for active state', () => {
      expect(getPrescriptionStateColor('active')).toBe('success');
    });

    it('returns success for claimed state', () => {
      expect(getPrescriptionStateColor('claimed')).toBe('success');
    });

    it('returns primary for submitted state', () => {
      expect(getPrescriptionStateColor('submitted')).toBe('primary');
    });

    it('returns warning for pending state', () => {
      expect(getPrescriptionStateColor('pending')).toBe('warning');
    });

    it('returns default for draft state', () => {
      expect(getPrescriptionStateColor('draft')).toBe('default');
    });

    it('returns secondary for inactive state', () => {
      expect(getPrescriptionStateColor('inactive')).toBe('secondary');
    });

    it('returns danger for expired state', () => {
      expect(getPrescriptionStateColor('expired')).toBe('danger');
    });

    it('handles case insensitivity', () => {
      expect(getPrescriptionStateColor('ACTIVE')).toBe('success');
      expect(getPrescriptionStateColor('Active')).toBe('success');
    });

    it('returns default for unknown states', () => {
      expect(getPrescriptionStateColor('unknown')).toBe('default');
    });

    it('returns default for null', () => {
      expect(getPrescriptionStateColor(null)).toBe('default');
    });

    it('returns default for undefined', () => {
      expect(getPrescriptionStateColor(undefined)).toBe('default');
    });
  });

  describe('getInviteStatusColor', () => {
    it('returns warning for pending status', () => {
      expect(getInviteStatusColor('pending')).toBe('warning');
    });

    it('returns success for accepted status', () => {
      expect(getInviteStatusColor('accepted')).toBe('success');
    });

    it('returns success for completed status', () => {
      expect(getInviteStatusColor('completed')).toBe('success');
    });

    it('returns danger for declined status', () => {
      expect(getInviteStatusColor('declined')).toBe('danger');
    });

    it('returns default for canceled status', () => {
      expect(getInviteStatusColor('canceled')).toBe('default');
    });

    it('returns danger for expired status', () => {
      expect(getInviteStatusColor('expired')).toBe('danger');
    });

    it('handles case insensitivity', () => {
      expect(getInviteStatusColor('PENDING')).toBe('warning');
      expect(getInviteStatusColor('Accepted')).toBe('success');
    });

    it('returns default for unknown statuses', () => {
      expect(getInviteStatusColor('unknown')).toBe('default');
    });

    it('returns default for null', () => {
      expect(getInviteStatusColor(null)).toBe('default');
    });

    it('returns default for undefined', () => {
      expect(getInviteStatusColor(undefined)).toBe('default');
    });
  });

  describe('getDataSourceStateColor', () => {
    it('returns success for connected state', () => {
      expect(getDataSourceStateColor('connected')).toBe('success');
    });

    it('returns danger for disconnected state', () => {
      expect(getDataSourceStateColor('disconnected')).toBe('danger');
    });

    it('returns danger for error state', () => {
      expect(getDataSourceStateColor('error')).toBe('danger');
    });

    it('handles case insensitivity', () => {
      expect(getDataSourceStateColor('CONNECTED')).toBe('success');
      expect(getDataSourceStateColor('Connected')).toBe('success');
    });

    it('returns default for unknown states', () => {
      expect(getDataSourceStateColor('unknown')).toBe('default');
    });

    it('returns default for null', () => {
      expect(getDataSourceStateColor(null)).toBe('default');
    });

    it('returns default for undefined', () => {
      expect(getDataSourceStateColor(undefined)).toBe('default');
    });
  });

  describe('getRoleColor', () => {
    it('returns primary for clinic_admin role', () => {
      expect(getRoleColor('clinic_admin')).toBe('primary');
    });

    it('returns success for prescriber role', () => {
      expect(getRoleColor('prescriber')).toBe('success');
    });

    it('returns default for clinic_member role', () => {
      expect(getRoleColor('clinic_member')).toBe('default');
    });

    it('handles case insensitivity', () => {
      expect(getRoleColor('CLINIC_ADMIN')).toBe('primary');
      expect(getRoleColor('Prescriber')).toBe('success');
    });

    it('returns default for unknown roles', () => {
      expect(getRoleColor('unknown')).toBe('default');
    });

    it('returns default for null', () => {
      expect(getRoleColor(null)).toBe('default');
    });

    it('returns default for undefined', () => {
      expect(getRoleColor(undefined)).toBe('default');
    });
  });

  describe('getStatusColor', () => {
    it('delegates to getPrescriptionStateColor for prescription type', () => {
      expect(getStatusColor('active', 'prescription')).toBe('success');
      expect(getStatusColor('expired', 'prescription')).toBe('danger');
    });

    it('delegates to getInviteStatusColor for invite type', () => {
      expect(getStatusColor('pending', 'invite')).toBe('warning');
      expect(getStatusColor('accepted', 'invite')).toBe('success');
    });

    it('delegates to getDataSourceStateColor for dataSource type', () => {
      expect(getStatusColor('connected', 'dataSource')).toBe('success');
      expect(getStatusColor('disconnected', 'dataSource')).toBe('danger');
    });

    it('delegates to getRoleColor for role type', () => {
      expect(getStatusColor('clinic_admin', 'role')).toBe('primary');
      expect(getStatusColor('prescriber', 'role')).toBe('success');
    });

    it('handles null status', () => {
      expect(getStatusColor(null, 'prescription')).toBe('default');
      expect(getStatusColor(null, 'invite')).toBe('default');
    });

    it('handles undefined status', () => {
      expect(getStatusColor(undefined, 'prescription')).toBe('default');
      expect(getStatusColor(undefined, 'role')).toBe('default');
    });
  });

  describe('formatRoleLabel', () => {
    it('formats clinic_admin as Admin', () => {
      expect(formatRoleLabel('clinic_admin')).toBe('Admin');
    });

    it('formats clinic_member as Member', () => {
      expect(formatRoleLabel('clinic_member')).toBe('Member');
    });

    it('formats prescriber as Prescriber', () => {
      expect(formatRoleLabel('prescriber')).toBe('Prescriber');
    });

    it('handles case insensitivity', () => {
      expect(formatRoleLabel('CLINIC_ADMIN')).toBe('Admin');
      expect(formatRoleLabel('Clinic_Member')).toBe('Member');
    });

    it('handles unknown roles by stripping CLINIC_ prefix', () => {
      expect(formatRoleLabel('CLINIC_VIEWER')).toBe('viewer');
    });

    it('returns empty string for null', () => {
      expect(formatRoleLabel(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatRoleLabel(undefined)).toBe('');
    });

    it('returns role as-is if no pattern matches', () => {
      expect(formatRoleLabel('custom_role')).toBe('custom_role');
    });
  });

  describe('color maps', () => {
    it('prescriptionStateColors contains all expected states', () => {
      expect(Object.keys(prescriptionStateColors)).toContain('active');
      expect(Object.keys(prescriptionStateColors)).toContain('claimed');
      expect(Object.keys(prescriptionStateColors)).toContain('submitted');
      expect(Object.keys(prescriptionStateColors)).toContain('pending');
      expect(Object.keys(prescriptionStateColors)).toContain('draft');
      expect(Object.keys(prescriptionStateColors)).toContain('inactive');
      expect(Object.keys(prescriptionStateColors)).toContain('expired');
    });

    it('inviteStatusColors contains all expected statuses', () => {
      expect(Object.keys(inviteStatusColors)).toContain('pending');
      expect(Object.keys(inviteStatusColors)).toContain('accepted');
      expect(Object.keys(inviteStatusColors)).toContain('completed');
      expect(Object.keys(inviteStatusColors)).toContain('declined');
      expect(Object.keys(inviteStatusColors)).toContain('canceled');
      expect(Object.keys(inviteStatusColors)).toContain('expired');
    });

    it('dataSourceStateColors contains all expected states', () => {
      expect(Object.keys(dataSourceStateColors)).toContain('connected');
      expect(Object.keys(dataSourceStateColors)).toContain('disconnected');
      expect(Object.keys(dataSourceStateColors)).toContain('error');
    });

    it('roleColors contains all expected roles', () => {
      expect(Object.keys(roleColors)).toContain('clinic_admin');
      expect(Object.keys(roleColors)).toContain('prescriber');
      expect(Object.keys(roleColors)).toContain('clinic_member');
    });
  });
});
