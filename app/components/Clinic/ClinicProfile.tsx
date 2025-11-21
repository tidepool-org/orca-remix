import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';

import type { Clinic, Patient, PatientInvite, RecentPatient, Clinician, RecentClinician } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';
import PatientsTable from './PatientsTable';
import PatientInvitesTable from './PatientInvitesTable';
import CliniciansTable from './CliniciansTable';
import RecentPatients from './RecentPatients';
import RecentClinicians from './RecentClinicians';

export type ClinicProfileProps = {
  clinic: Clinic;
  patients?: Patient[];
  totalPatients?: number;
  patientsLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  patientInvites?: PatientInvite[];
  totalInvites?: number;
  invitesLoading?: boolean;
  clinicians?: Clinician[];
  totalClinicians?: number;
  cliniciansLoading?: boolean;
  cliniciansTotalPages?: number;
  cliniciansCurrentPage?: number;
  cliniciansPageSize?: number;
  recentPatients?: RecentPatient[];
  recentClinicians?: RecentClinician[];
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onCliniciansPageChange?: (page: number) => void;
  onCliniciansSort?: (column: string, direction: 'asc' | 'desc') => void;
};

export default function ClinicProfile({
  clinic,
  patients = [],
  totalPatients = 0,
  patientsLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  patientInvites = [],
  totalInvites = 0,
  invitesLoading = false,
  clinicians = [],
  totalClinicians = 0,
  cliniciansLoading = false,
  cliniciansTotalPages = 1,
  cliniciansCurrentPage = 1,
  cliniciansPageSize,
  recentPatients = [],
  recentClinicians = [],
  onPageChange,
  onSort,
  onCliniciansPageChange,
  onCliniciansSort,
}: ClinicProfileProps) {
  const { id, shareCode, name, createdTime, canMigrate, tier } = clinic;
  const { locale } = useLocale();

  const clinicDetails = [
    {
      label: 'Share Code',
      value: shareCode,
      copy: true,
    },
    {
      label: 'Clinic ID',
      value: id,
      copy: true,
    },
    { label: 'Clinic Tier', value: tier },
    { label: 'Can Migrate', value: canMigrate.toString() },
    {
      label: 'Created On',
      value: intlFormat(
        new Date(createdTime),
        {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        },
        { locale },
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <Well>
        <p className="text-xl">{name}</p>

        <div className="text-sm">
          {clinicDetails.map(({ label, value, copy }, i) => (
            <div
              key={i}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              <p>{value}</p>
              {copy && <ClipboardButton clipboardText={value} />}
            </div>
          ))}
        </div>
      </Well>

      <Well>
        <PatientsTable
          patients={patients}
          isLoading={patientsLoading}
          totalPages={totalPages}
          totalPatients={totalPatients}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onSort={onSort}
        />
      </Well>

      <Well className="bg-content1 border border-content2 p-0">
        <PatientInvitesTable
          invites={patientInvites}
          isLoading={invitesLoading}
          totalInvites={totalInvites}
          onSort={onSort}
        />
      </Well>

      <Well>
        <CliniciansTable
          clinicians={clinicians}
          totalClinicians={totalClinicians}
          isLoading={cliniciansLoading}
          totalPages={cliniciansTotalPages}
          currentPage={cliniciansCurrentPage}
          pageSize={cliniciansPageSize}
          onPageChange={onCliniciansPageChange}
          onSort={onCliniciansSort}
        />
      </Well>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Well>
          <RecentPatients rows={recentPatients} />
        </Well>
        
        <Well>
          <RecentClinicians recentClinicians={recentClinicians} />
        </Well>
      </div>
    </div>
  );
}
