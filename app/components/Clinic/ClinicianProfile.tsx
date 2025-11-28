import { Chip } from "@heroui/react";
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import Well from '~/partials/Well';
import ClipboardButton from '../ClipboardButton';
import ClinicsTable from './ClinicsTable';
import type { Clinician, ClinicianClinicMembership } from './types';

export type ClinicianProfileProps = {
  clinician: Clinician | null;
  isLoading?: boolean;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
  clinicsLoading?: boolean;
};

export default function ClinicianProfile({
  clinician,
  isLoading,
  clinics = [],
  totalClinics = 0,
  clinicsLoading = false,
}: ClinicianProfileProps) {
  const { locale } = useLocale();

  if (isLoading) {
    return (
      <Well>
        <div className="animate-pulse">
          <div className="h-6 bg-content2 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-content2 rounded w-1/2"></div>
            <div className="h-4 bg-content2 rounded w-3/4"></div>
            <div className="h-4 bg-content2 rounded w-1/4"></div>
          </div>
        </div>
      </Well>
    );
  }

  if (!clinician) {
    return (
      <Well>
        <p className="text-default-600">Clinician not found</p>
      </Well>
    );
  }

  const formatDate = (dateString: string) => {
    return intlFormat(
      new Date(dateString),
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      },
      { locale },
    );
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'primary';
      case 'member':
      default:
        return 'default';
    }
  };

  const clinicianDetails = [
    {
      label: 'Email',
      value: clinician.email,
      copy: true,
    },
    {
      label: 'Clinician ID',
      value: clinician.id,
      copy: true,
    },
    {
      label: 'Role',
      value: clinician.roles?.[0] || 'N/A',
      component: (
        <Chip
          color={getRoleColor(clinician.roles?.[0])}
          variant="flat"
          size="sm"
          className="capitalize"
        >
          {clinician.roles?.[0]}
        </Chip>
      ),
    },
    {
      label: 'Added to Clinic',
      value: formatDate(clinician.createdTime),
    },
    {
      label: 'Last Updated',
      value: formatDate(clinician.updatedTime),
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <Well>
        <h1 className="text-xl">{name}</h1>

        <div className="text-sm">
          {clinicianDetails.map(({ label, value, copy, component }, i) => (
            <div
              key={i}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              {component ? (
                component
              ) : (
                <>
                  <p>{value}</p>
                  {copy && <ClipboardButton clipboardText={value} />}
                </>
              )}
            </div>
          ))}
        </div>
      </Well>

      <Well>
        <ClinicsTable
          clinics={clinics}
          totalClinics={totalClinics}
          isLoading={clinicsLoading}
          totalPages={1}
          currentPage={1}
        />
      </Well>
    </div>
  );
}
