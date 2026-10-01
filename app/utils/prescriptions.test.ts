import { describe, it, expect } from 'vitest';
import { filterPrescriptions, sortPrescriptions } from './prescriptions';
import type { Prescription } from '~/components/Clinic/types';

const prescription = (
  id: string,
  state: Prescription['state'],
  createdTime: string,
  attributes: { firstName?: string; lastName?: string },
  expirationTime?: string,
): Prescription => ({
  id,
  clinicId: 'clinic-1',
  state,
  createdTime,
  createdUserId: 'user-1',
  modifiedTime: createdTime,
  modifiedUserId: 'user-1',
  expirationTime,
  latestRevision: { attributes },
});

// API order
const prescriptions = [
  prescription(
    'john',
    'active',
    '2024-01-15T10:30:00Z',
    { firstName: 'John', lastName: 'Doe' },
    '2025-01-15T10:30:00Z',
  ),
  prescription('jane', 'pending', '2024-02-20T14:00:00Z', {
    firstName: 'Jane',
    lastName: 'Smith',
  }),
  prescription(
    'bob',
    'expired',
    '2023-06-10T09:00:00Z',
    { firstName: 'Bob' },
    '2024-06-10T09:00:00Z',
  ),
];

const ids = (list: Prescription[]) => list.map((p) => p.id);

describe('filterPrescriptions', () => {
  it('matches the patient name case-insensitively', () => {
    expect(ids(filterPrescriptions(prescriptions, 'JOHN'))).toEqual(['john']);
  });

  it('matches the state', () => {
    expect(ids(filterPrescriptions(prescriptions, 'pending'))).toEqual([
      'jane',
    ]);
  });

  it.each([undefined, '', '   '])('returns every row for search %j', (s) => {
    expect(filterPrescriptions(prescriptions, s)).toBe(prescriptions);
  });
});

describe('sortPrescriptions', () => {
  it('sorts by patient name', () => {
    expect(ids(sortPrescriptions(prescriptions, '+patientName'))).toEqual([
      'bob',
      'jane',
      'john',
    ]);
  });

  it('sorts by state', () => {
    expect(ids(sortPrescriptions(prescriptions, '+state'))).toEqual([
      'john',
      'bob',
      'jane',
    ]);
  });

  it('sorts created newest-first on descending', () => {
    expect(ids(sortPrescriptions(prescriptions, '-createdTime'))).toEqual([
      'jane',
      'john',
      'bob',
    ]);
  });

  it('sorts a missing expiry last on descending', () => {
    expect(ids(sortPrescriptions(prescriptions, '-expirationTime'))).toEqual([
      'john',
      'bob',
      'jane',
    ]);
  });

  it('keeps API order with no sort', () => {
    expect(ids(sortPrescriptions(prescriptions))).toEqual(ids(prescriptions));
  });
});
