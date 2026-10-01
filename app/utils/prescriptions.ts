import type { Prescription } from '~/components/Clinic/types';
import {
  compareDates,
  compareText,
  filterRows,
  sortRows,
} from '~/utils/tableRows';

/**
 * Extracts the patient's display name from a prescription's latest revision attributes.
 * Returns 'N/A' if no name fields are available.
 */
export function getPatientName(prescription: Prescription): string {
  const attrs = prescription.latestRevision?.attributes;
  if (attrs?.firstName && attrs?.lastName) {
    return `${attrs.firstName} ${attrs.lastName}`;
  }
  if (attrs?.firstName) return attrs.firstName;
  if (attrs?.lastName) return attrs.lastName;
  return 'N/A';
}

export const filterPrescriptions = (
  prescriptions: Prescription[],
  search?: string,
) =>
  filterRows(prescriptions, search, (p) => {
    const attrs = p.latestRevision?.attributes;
    return [`${attrs?.firstName || ''} ${attrs?.lastName || ''}`, p.state];
  });

const comparators = {
  patientName: (a: Prescription, b: Prescription) =>
    compareText(getPatientName(a), getPatientName(b)),
  state: (a: Prescription, b: Prescription) => compareText(a.state, b.state),
  createdTime: (a: Prescription, b: Prescription) =>
    compareDates(a.createdTime, b.createdTime),
  expirationTime: (a: Prescription, b: Prescription) =>
    compareDates(a.expirationTime, b.expirationTime),
};

export const sortPrescriptions = (
  prescriptions: Prescription[],
  sort?: string,
) => sortRows(prescriptions, sort, comparators);
