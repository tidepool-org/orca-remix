import { Tab } from '@heroui/react';
import { useState, useEffect } from 'react';
import { Building2, Settings } from 'lucide-react';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import useProfileExpanded from '~/hooks/useProfileExpanded';
import ClinicsTable from './ClinicsTable';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
import StatusChip from '~/components/ui/StatusChip';
import SettingsToggleRow from '~/components/ui/SettingsToggleRow';
import SaveCancelButtons from '~/components/ui/SaveCancelButtons';
import SectionPanel from '~/components/ui/SectionPanel';
import ViewUserAccountLink from '~/components/ui/ViewUserAccountLink';
import RollbarLink from '~/components/ui/RollbarLink';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import { useToast } from '~/contexts/ToastContext';
import type { Clinician, ClinicianClinicMembership } from './types';
import { formatShortDate } from '~/utils/dateFormatters';

export type ClinicianProfileProps = {
  clinician: Clinician | null;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
  clinicsLoading?: boolean;
  clinicId?: string;
  // Tab control props
  selectedTab?: string;
  onTabChange?: (key: React.Key) => void;
};

export default function ClinicianProfile({
  clinician,
  clinics = [],
  totalClinics = 0,
  clinicsLoading = false,
  clinicId,
  // Tab control props
  selectedTab,
  onTabChange,
}: ClinicianProfileProps) {
  const { locale } = useLocale();
  const profileExpandedProps = useProfileExpanded('clinician');
  const fetcher = useFetcher();
  const { showToast } = useToast();

  // Show toast on fetcher response
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (data.success) {
        showToast(
          data.message || 'Clinician roles updated successfully',
          'success',
        );
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    }
  }, [fetcher.state, fetcher.data, showToast]);

  // Check if clinician has specific roles
  const hasRole = (role: string) => {
    return clinician?.roles?.some(
      (r) => r.toLowerCase() === role.toLowerCase(),
    );
  };

  const serverIsAdmin = hasRole('CLINIC_ADMIN');
  const serverIsPrescriber = hasRole('PRESCRIBER');

  // Staged local state for role toggles
  const [stagedAdmin, setStagedAdmin] = useState(serverIsAdmin);
  const [stagedPrescriber, setStagedPrescriber] = useState(serverIsPrescriber);

  // Reset staged state when server roles change (after successful save)
  const rolesKey = clinician?.roles?.join(',');
  const [prevRolesKey, setPrevRolesKey] = useState(rolesKey);
  if (rolesKey !== prevRolesKey) {
    setPrevRolesKey(rolesKey);
    setStagedAdmin(serverIsAdmin);
    setStagedPrescriber(serverIsPrescriber);
  }

  if (!clinician) {
    return (
      <div className="w-full rounded-lg border-2 border-content2 overflow-hidden">
        <div className="p-4 bg-content1">
          <p className="text-default-600">Clinician not found</p>
        </div>
      </div>
    );
  }

  // Check if the fetcher is currently updating
  const isUpdating = fetcher.state === 'submitting';

  // Dirty detection
  const isAdminDirty = stagedAdmin !== serverIsAdmin;
  const isPrescriberDirty = stagedPrescriber !== serverIsPrescriber;

  // Build roles array from staged state and submit
  const submitRoles = (admin: boolean, prescriber: boolean) => {
    if (!clinicId) return;

    const newRoles: string[] = [];
    newRoles.push(admin ? 'CLINIC_ADMIN' : 'CLINIC_MEMBER');
    if (prescriber) {
      newRoles.push('PRESCRIBER');
    }

    fetcher.submit(
      {
        intent: 'update-roles',
        roles: JSON.stringify(newRoles),
        clinician: JSON.stringify(clinician),
      },
      { method: 'POST' },
    );
  };

  // Save/cancel handlers
  const handleAdminSave = () => {
    submitRoles(stagedAdmin, serverIsPrescriber);
  };

  const handleAdminCancel = () => {
    setStagedAdmin(serverIsAdmin);
  };

  const handlePrescriberSave = () => {
    submitRoles(serverIsAdmin, stagedPrescriber);
  };

  const handlePrescriberCancel = () => {
    setStagedPrescriber(serverIsPrescriber);
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
        actionLink={
          <>
            <ViewUserAccountLink userId={clinician.id} />
            <RollbarLink userId={clinician.id} />
          </>
        }
        detailFields={clinicianDetailFields}
        {...profileExpandedProps}
      />

      <div className="w-full">
        <ProfileTabs
          aria-label="Clinician profile sections"
          selectedKey={selectedTab}
          onSelectionChange={onTabChange}
        >
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
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <SettingsToggleRow
                          label="Clinic Admin"
                          description="Admin users can manage clinic settings, invite other clinicians, and manage patients."
                          isSelected={stagedAdmin}
                          onValueChange={setStagedAdmin}
                          isDisabled={isUpdating}
                          ariaLabel="Toggle admin role"
                        />
                      </div>
                      {isAdminDirty && (
                        <SaveCancelButtons
                          onSave={handleAdminSave}
                          onCancel={handleAdminCancel}
                          isDisabled={isUpdating}
                          saveAriaLabel="Save admin role change"
                          cancelAriaLabel="Cancel admin role change"
                        />
                      )}
                    </div>

                    {/* Prescriber Toggle */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <SettingsToggleRow
                          label="Prescriber"
                          description="Prescribers can create and manage prescriptions for patients."
                          isSelected={stagedPrescriber}
                          onValueChange={setStagedPrescriber}
                          isDisabled={isUpdating}
                          ariaLabel="Toggle prescriber role"
                        />
                      </div>
                      {isPrescriberDirty && (
                        <SaveCancelButtons
                          onSave={handlePrescriberSave}
                          onCancel={handlePrescriberCancel}
                          isDisabled={isUpdating}
                          saveAriaLabel="Save prescriber role change"
                          cancelAriaLabel="Cancel prescriber role change"
                        />
                      )}
                    </div>
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
