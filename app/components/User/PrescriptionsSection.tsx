import PrescriptionsTable from '../Clinic/PrescriptionsTable';
import type { Prescription } from '../Clinic/types';

export type PrescriptionsSectionProps = {
  prescriptions: Prescription[];
  totalPrescriptions: number;
  isLoading?: boolean;
};

export default function PrescriptionsSection({
  prescriptions = [],
  totalPrescriptions = 0,
  isLoading = false,
}: PrescriptionsSectionProps) {
  return (
    <PrescriptionsTable
      prescriptions={prescriptions}
      totalPrescriptions={totalPrescriptions}
      isLoading={isLoading}
      showClinicLink={true}
    />
  );
}
