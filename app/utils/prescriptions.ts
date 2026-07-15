import type { Prescription } from '~/components/Clinic/types';

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
