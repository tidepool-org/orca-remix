import { describe, it, expect } from 'vitest';
import {
  filterClinicians,
  primaryRoleLabel,
  sortClinicians,
} from './clinicians';
import type { Clinician } from '~/components/Clinic/types';

const clinician = (
  name: string,
  email: string,
  roles: string[],
  createdTime: string,
): Clinician => ({
  id: name,
  name,
  email,
  roles,
  createdTime,
  updatedTime: createdTime,
});

// API order
const clinicians = [
  clinician('Carol', 'a@clinic.com', ['CLINIC_MEMBER'], '2026-01-02T10:00:00Z'),
  clinician(
    'bob',
    'd@clinic.com',
    ['CLINIC_ADMIN', 'PRESCRIBER'],
    '2026-03-04T10:00:00Z',
  ),
  clinician('Alice', 'b@clinic.com', ['CLINIC_ADMIN'], '2026-02-03T10:00:00Z'),
  clinician('Dan', 'c@clinic.com', ['PRESCRIBER'], '2026-04-05T10:00:00Z'),
];

const names = (list: Clinician[]) => list.map((c) => c.name);

describe('filterClinicians', () => {
  it('matches the name or email case-insensitively', () => {
    expect(names(filterClinicians(clinicians, 'ALICE'))).toEqual(['Alice']);
    expect(names(filterClinicians(clinicians, 'd@clinic'))).toEqual(['bob']);
  });

  it.each([undefined, '', '   '])('returns every row for search %j', (s) => {
    expect(filterClinicians(clinicians, s)).toBe(clinicians);
  });
});

describe('sortClinicians', () => {
  it('sorts by name case-insensitively in both directions', () => {
    expect(names(sortClinicians(clinicians, '+name'))).toEqual([
      'Alice',
      'bob',
      'Carol',
      'Dan',
    ]);
    expect(names(sortClinicians(clinicians, '-name'))).toEqual([
      'Dan',
      'Carol',
      'bob',
      'Alice',
    ]);
  });

  it('sorts by email in both directions', () => {
    expect(names(sortClinicians(clinicians, '+email'))).toEqual([
      'Carol',
      'Alice',
      'Dan',
      'bob',
    ]);
    expect(names(sortClinicians(clinicians, '-email'))).toEqual([
      'bob',
      'Dan',
      'Alice',
      'Carol',
    ]);
  });

  it('puts admins before members and keeps ties in API order', () => {
    expect(names(sortClinicians(clinicians, '+roles'))).toEqual([
      'bob',
      'Alice',
      'Carol',
      'Dan',
    ]);
  });

  it('sorts by added date, newest first on descending', () => {
    expect(names(sortClinicians(clinicians, '-createdTime'))).toEqual([
      'Dan',
      'bob',
      'Alice',
      'Carol',
    ]);
  });

  it.each([undefined, '', '+nope'])(
    'returns the original order for sort %j',
    (sort) => {
      expect(names(sortClinicians(clinicians, sort))).toEqual(
        names(clinicians),
      );
    },
  );

  it('does not mutate the input', () => {
    const input = [...clinicians];
    sortClinicians(input, '+name');
    expect(input).toEqual(clinicians);
  });
});

describe('primaryRoleLabel', () => {
  it('derives the displayed primary-role label', () => {
    expect(primaryRoleLabel(['CLINIC_ADMIN', 'PRESCRIBER'])).toBe('admin');
    expect(primaryRoleLabel(['CLINIC_MEMBER'])).toBe('member');
    expect(primaryRoleLabel([])).toBe('Unknown');
  });
});
