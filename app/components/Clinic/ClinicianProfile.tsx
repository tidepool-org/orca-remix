import { Tab } from '@heroui/react';
import { Building2, Settings } from 'lucide-react';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import ClinicsTable from './ClinicsTable';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
import StatusChip from '~/components/ui/StatusChip';
import SettingsToggleRow from '~/components/ui/SettingsToggleRow';
import SectionPanel from '~/components/ui/SectionPanel';
import ViewUserAccountLink from '~/components/ui/ViewUserAccountLink';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import type { Clinician, ClinicianClinicMembership } from './types';
import { formatShortDate } from '~/utils/dateFormatters';

export type ClinicianProfileProps = {
  clinician: Clinician | null;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
  clinicsLoading?: boolean;
  clinicId?: string;
};

export default function ClinicianProfile({
  clinician,
  clinics = [],
  totalClinics = 0,
  clinicsLoading = false,
  clinicId,
}: ClinicianProfileProps) {
  const { locale } = useLocale();
  const fetcher = useFetcher();

  if (!clinician) {
    return (
      <div className="w-full rounded-lg border-2 border-content2 overflow-hidden">
        <div className="p-4 bg-content1">
          <p className="text-default-600">Clinician not found</p>
        </div>
      </div>
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
            <StatusChip key={role} status={role} type="role" />
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
        actionLink={<ViewUserAccountLink userId={clinician.id} />}
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
              <CollapsibleGroup>
                <ClinicsTable
                  clinics={clinics}
                  totalClinics={totalClinics}
                  isLoading={clinicsLoading}
                  totalPages={1}
                  currentPage={1}
                  isFirstInGroup
                />
              </CollapsibleGroup>
            </div>
          </Tab>

          {/* Settings Tab - only show if clinicId is provided */}
          {clinicId && (
            <Tab
              key="settings"
              title={<TabTitle icon={Settings} label="Settings" />}
            >
              <div className="pt-6">
                <SectionPanel
                  title="Clinician Role Settings"
                  subtitle="Manage clinician permissions for this clinic."
                >
                  <div className="flex flex-col gap-6">
                    {/* Admin Toggle */}
                    <SettingsToggleRow
                      label="Clinic Admin"
                      description="Admin users can manage clinic settings, invite other clinicians, and manage patients."
                      isSelected={isAdmin}
                      onValueChange={handleAdminToggle}
                      isDisabled={isUpdating}
                      ariaLabel="Toggle admin role"
                    />

                    {/* Prescriber Toggle */}
                    <SettingsToggleRow
                      label="Prescriber"
                      description="Prescribers can create and manage prescriptions for patients."
                      isSelected={isPrescriber}
                      onValueChange={handlePrescriberToggle}
                      isDisabled={isUpdating}
                      ariaLabel="Toggle prescriber role"
                    />
                  </div>

                  {fetcher.data?.error && (
                    <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">
                      {fetcher.data.error}
                    </div>
                  )}
                </SectionPanel>
              </div>
            </Tab>
          )}
        </ProfileTabs>
      </div>
    </div>
  );
}
