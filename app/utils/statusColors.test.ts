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
    it.each([
      ['active', 'success'],
      ['claimed', 'success'],
      ['submitted', 'primary'],
      ['pending', 'warning'],
      ['draft', 'default'],
      ['inactive', 'secondary'],
      ['expired', 'danger'],
    ])('returns %s color for %s state', (state, expected) => {
      expect(getPrescriptionStateColor(state)).toBe(expected);
    });

    it.each([
      ['ACTIVE', 'success'],
      ['Active', 'success'],
      ['PENDING', 'warning'],
    ])('handles case insensitivity: %s returns %s', (state, expected) => {
      expect(getPrescriptionStateColor(state)).toBe(expected);
    });

    it.each([['unknown'], [null], [undefined]])(
      'returns default for %s',
      (state) => {
        expect(getPrescriptionStateColor(state)).toBe('default');
      },
    );
  });

  describe('getInviteStatusColor', () => {
    it.each([
      ['pending', 'warning'],
      ['accepted', 'success'],
      ['completed', 'success'],
      ['declined', 'danger'],
      ['canceled', 'default'],
      ['expired', 'danger'],
    ])('returns %s color for %s status', (status, expected) => {
      expect(getInviteStatusColor(status)).toBe(expected);
    });

    it.each([
      ['PENDING', 'warning'],
      ['Accepted', 'success'],
    ])('handles case insensitivity: %s returns %s', (status, expected) => {
      expect(getInviteStatusColor(status)).toBe(expected);
    });

    it.each([['unknown'], [null], [undefined]])(
      'returns default for %s',
      (status) => {
        expect(getInviteStatusColor(status)).toBe('default');
      },
    );
  });

  describe('getDataSourceStateColor', () => {
    it.each([
      ['connected', 'success'],
      ['disconnected', 'danger'],
      ['error', 'danger'],
    ])('returns %s color for %s state', (state, expected) => {
      expect(getDataSourceStateColor(state)).toBe(expected);
    });

    it.each([
      ['CONNECTED', 'success'],
      ['Connected', 'success'],
    ])('handles case insensitivity: %s returns %s', (state, expected) => {
      expect(getDataSourceStateColor(state)).toBe(expected);
    });

    it.each([['unknown'], [null], [undefined]])(
      'returns default for %s',
      (state) => {
        expect(getDataSourceStateColor(state)).toBe('default');
      },
    );
  });

  describe('getRoleColor', () => {
    it.each([
      ['clinic_admin', 'primary'],
      ['prescriber', 'success'],
      ['clinic_member', 'default'],
    ])('returns %s color for %s role', (role, expected) => {
      expect(getRoleColor(role)).toBe(expected);
    });

    it.each([
      ['CLINIC_ADMIN', 'primary'],
      ['Prescriber', 'success'],
    ])('handles case insensitivity: %s returns %s', (role, expected) => {
      expect(getRoleColor(role)).toBe(expected);
    });

    it.each([['unknown'], [null], [undefined]])(
      'returns default for %s',
      (role) => {
        expect(getRoleColor(role)).toBe('default');
      },
    );
  });

  describe('getStatusColor', () => {
    it.each([
      ['active', 'prescription', 'success'],
      ['expired', 'prescription', 'danger'],
      ['pending', 'invite', 'warning'],
      ['accepted', 'invite', 'success'],
      ['connected', 'dataSource', 'success'],
      ['disconnected', 'dataSource', 'danger'],
      ['clinic_admin', 'role', 'primary'],
      ['prescriber', 'role', 'success'],
    ] as const)(
      'returns %s for status=%s type=%s',
      (status, type, expected) => {
        expect(getStatusColor(status, type)).toBe(expected);
      },
    );

    it.each([
      [null, 'prescription'],
      [null, 'invite'],
      [undefined, 'prescription'],
      [undefined, 'role'],
    ] as const)(
      'returns default for %s status with %s type',
      (status, type) => {
        expect(getStatusColor(status, type)).toBe('default');
      },
    );
  });

  describe('formatRoleLabel', () => {
    it.each([
      ['clinic_admin', 'Admin'],
      ['clinic_member', 'Member'],
      ['prescriber', 'Prescriber'],
    ])('formats %s as %s', (role, expected) => {
      expect(formatRoleLabel(role)).toBe(expected);
    });

    it.each([
      ['CLINIC_ADMIN', 'Admin'],
      ['Clinic_Member', 'Member'],
    ])('handles case insensitivity: %s returns %s', (role, expected) => {
      expect(formatRoleLabel(role)).toBe(expected);
    });

    it('handles unknown roles by stripping CLINIC_ prefix', () => {
      expect(formatRoleLabel('CLINIC_VIEWER')).toBe('viewer');
    });

    it.each([
      [null, ''],
      [undefined, ''],
    ])('returns empty string for %s', (role, expected) => {
      expect(formatRoleLabel(role)).toBe(expected);
    });

    it('returns role as-is if no pattern matches', () => {
      expect(formatRoleLabel('custom_role')).toBe('custom_role');
    });
  });

  describe('color maps', () => {
    it('prescriptionStateColors contains all expected states', () => {
      const expectedStates = [
        'active',
        'claimed',
        'submitted',
        'pending',
        'draft',
        'inactive',
        'expired',
      ];
      expectedStates.forEach((state) => {
        expect(Object.keys(prescriptionStateColors)).toContain(state);
      });
    });

    it('inviteStatusColors contains all expected statuses', () => {
      const expectedStatuses = [
        'pending',
        'accepted',
        'completed',
        'declined',
        'canceled',
        'expired',
      ];
      expectedStatuses.forEach((status) => {
        expect(Object.keys(inviteStatusColors)).toContain(status);
      });
    });

    it('dataSourceStateColors contains all expected states', () => {
      const expectedStates = ['connected', 'disconnected', 'error'];
      expectedStates.forEach((state) => {
        expect(Object.keys(dataSourceStateColors)).toContain(state);
      });
    });

    it('roleColors contains all expected roles', () => {
      const expectedRoles = ['clinic_admin', 'prescriber', 'clinic_member'];
      expectedRoles.forEach((role) => {
        expect(Object.keys(roleColors)).toContain(role);
      });
    });
  });
});
