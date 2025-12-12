import { Chip, Tab, Switch } from '@heroui/react';
import { Building2, Settings } from 'lucide-react';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import Well from '~/partials/Well';
import ClinicsTable from './ClinicsTable';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
import type { Clinician, ClinicianClinicMembership } from './types';
import { formatShortDate } from '~/utils/dateFormatters';
import { getRoleColor, formatRoleLabel } from '~/utils/statusColors';

export type ClinicianProfileProps = {
  clinician: Clinician | null;
  isLoading?: boolean;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
  clinicsLoading?: boolean;
  clinicId?: string;
};

export default function ClinicianProfile({
  clinician,
  isLoading,
  clinics = [],
  totalClinics = 0,
  clinicsLoading = false,
  clinicId,
}: ClinicianProfileProps) {
  const { locale } = useLocale();
  const fetcher = useFetcher();

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

  // Check if clinician has specific roles
  const hasRole = (role: string) => {
    return clinician.roles?.some((r) => r.toLowerCase() === role.toLowerCase());
  };

  const isAdmin = hasRole('CLINIC_ADMIN');
  const isPrescriber = hasRole('PRESCRIBER');

  // Check if the fetcher is currently updating
  const isUpdating = fetcher.state === 'submitting';

  // Handle toggle changes
  const handleAdminToggle = (checked: boolean) => {
    if (!clinicId) return;

    // Build new roles array
    let newRoles: string[];
    if (checked) {
      // Setting admin: remove CLINIC_MEMBER, add CLINIC_ADMIN
      newRoles = clinician.roles
        .filter((r) => r !== 'CLINIC_MEMBER')
        .filter((r) => r !== 'CLINIC_ADMIN');
      newRoles.push('CLINIC_ADMIN');
    } else {
      // Unsetting admin: remove CLINIC_ADMIN, add CLINIC_MEMBER
      newRoles = clinician.roles
        .filter((r) => r !== 'CLINIC_ADMIN')
        .filter((r) => r !== 'CLINIC_MEMBER');
      newRoles.push('CLINIC_MEMBER');
    }

    fetcher.submit(
      {
        intent: 'update-roles',
        roles: JSON.stringify(newRoles),
      },
      { method: 'POST' },
    );
  };

  const handlePrescriberToggle = (checked: boolean) => {
    if (!clinicId) return;

    // Build new roles array
    let newRoles: string[];
    if (checked) {
      // Add PRESCRIBER role
      newRoles = [
        ...clinician.roles.filter((r) => r !== 'PRESCRIBER'),
        'PRESCRIBER',
      ];
    } else {
      // Remove PRESCRIBER role
      newRoles = clinician.roles.filter((r) => r !== 'PRESCRIBER');
    }

    fetcher.submit(
      {
        intent: 'update-roles',
        roles: JSON.stringify(newRoles),
      },
      { method: 'POST' },
    );
  };

  // Clinician details section - using ProfileHeader component
  const clinicianIdentifiers = [
    ...(clinician.email ? [{ value: clinician.email }] : []),
    { label: 'ID:', value: clinician.id, monospace: true },
  ];

  const clinicianDetailFields = [
    {
      label: 'Roles',
      value: (
        <div className="flex gap-1 flex-wrap mt-0.5">
          {clinician.roles?.map((role) => (
            <Chip
              key={role}
              color={getRoleColor(role)}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {formatRoleLabel(role)}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      label: 'Added to Clinic',
      value: formatShortDate(clinician.createdTime, locale),
    },
    {
      label: 'Last Updated',
      value: formatShortDate(clinician.updatedTime, locale),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <ProfileHeader
        title={clinician.name}
        identifiers={clinicianIdentifiers}
        detailFields={clinicianDetailFields}
      />

      <div className="w-full">
        <ProfileTabs aria-label="Clinician profile sections">
          {/* Clinics Tab */}
          <Tab
            key="clinics"
            title={
              <TabTitle icon={Building2} label="Clinics" count={totalClinics} />
            }
          >
            <div className="pt-6">
              <ClinicsTable
                clinics={clinics}
                totalClinics={totalClinics}
                isLoading={clinicsLoading}
                totalPages={1}
                currentPage={1}
              />
            </div>
          </Tab>

          {/* Settings Tab - only show if clinicId is provided */}
          {clinicId && (
            <Tab
              key="settings"
              title={<TabTitle icon={Settings} label="Settings" />}
            >
              <div className="pt-6">
                <Well>
                  <h2 className="text-lg font-semibold mb-4">
                    Clinician Role Settings
                  </h2>
                  <p className="text-sm text-default-500 mb-6">
                    Manage clinician permissions for this clinic.
                  </p>

                  <div className="flex flex-col gap-6">
                    {/* Admin Toggle */}
                    <div className="flex items-center justify-between p-4 bg-content2 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Clinic Admin</span>
                        <span className="text-sm text-default-500">
                          Admin users can manage clinic settings, invite other
                          clinicians, and manage patients.
                        </span>
                      </div>
                      <Switch
                        isSelected={isAdmin}
                        onValueChange={handleAdminToggle}
                        isDisabled={isUpdating}
                        aria-label="Toggle admin role"
                      />
                    </div>

                    {/* Prescriber Toggle */}
                    <div className="flex items-center justify-between p-4 bg-content2 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Prescriber</span>
                        <span className="text-sm text-default-500">
                          Prescribers can create and manage prescriptions for
                          patients.
                        </span>
                      </div>
                      <Switch
                        isSelected={isPrescriber}
                        onValueChange={handlePrescriberToggle}
                        isDisabled={isUpdating}
                        aria-label="Toggle prescriber role"
                      />
                    </div>
                  </div>

                  {fetcher.data?.error && (
                    <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">
                      {fetcher.data.error}
                    </div>
                  )}
                </Well>
              </div>
            </Tab>
          )}
        </ProfileTabs>
      </div>
    </div>
  );
}
