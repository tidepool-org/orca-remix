import type { Clinician } from '~/components/Clinic/types';
import {
  compareDates,
  compareText,
  filterRows,
  sortRows,
} from '~/utils/tableRows';

export function primaryRoleLabel(roles: string[]): string {
  return roles.length > 0
    ? roles[0].replace('CLINIC_', '').toLowerCase()
    : 'Unknown';
}

export const filterClinicians = (clinicians: Clinician[], search?: string) =>
  filterRows(clinicians, search, (c) => [c.name, c.email]);

const comparators = {
  name: (a: Clinician, b: Clinician) => compareText(a.name, b.name),
  email: (a: Clinician, b: Clinician) => compareText(a.email, b.email),
  roles: (a: Clinician, b: Clinician) =>
    compareText(
      primaryRoleLabel(a.roles ?? []),
      primaryRoleLabel(b.roles ?? []),
    ),
  createdTime: (a: Clinician, b: Clinician) =>
    compareDates(a.createdTime, b.createdTime),
};

export const sortClinicians = (clinicians: Clinician[], sort?: string) =>
  sortRows(clinicians, sort, comparators);
