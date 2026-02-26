import { formatShortDate } from '~/utils/dateFormatters';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Button,
  Tab,
  Input,
} from '@heroui/react';
import { Users, UserCog, FileText, Settings, Trash2 } from 'lucide-react';
import type { Key } from 'react';

import type {
  Clinic,
  Patient,
  PatientInvite,
  Clinician,
  ClinicianInvite,
  Prescription,
  ClinicMrnSettings,
  ClinicPatientCountSettings,
} from './types';
import type { ResourceState } from '~/api.types';
import useLocale from '~/hooks/useLocale';
import PatientsTable from './PatientsTable';
import PatientInvitesTable from './PatientInvitesTable';
import CliniciansTable from './CliniciansTable';
import ClinicianInvitesTable from './ClinicianInvitesTable';
import PrescriptionsTable from './PrescriptionsTable';
import RecentPatients from './RecentPatients';
import RecentClinicians from './RecentClinicians';
import ConfirmationModal from '../ConfirmationModal';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
import SettingsToggleRow from '~/components/ui/SettingsToggleRow';
import DangerZoneSection, {
  DangerZoneAction,
} from '~/components/ui/DangerZoneSection';
import SaveCancelButtons from '~/components/ui/SaveCancelButtons';
import SectionPanel from '~/components/ui/SectionPanel';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import { timezoneNames } from '~/utils/timezoneNames';

const tierOptions = [
  { key: 'tier0100', label: 'Tier 0100' },
  { key: 'tier0200', label: 'Tier 0200' },
  { key: 'tier0300', label: 'Tier 0300' },
  { key: 'tier0400', label: 'Tier 0400' },
];

const DEFAULT_PATIENT_LIMIT = 250;
const PATIENT_LIMIT_STEP = 25;

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
  clinicianInvites?: ClinicianInvite[];
  totalClinicianInvites?: number;
  clinicianInvitesLoading?: boolean;
  prescriptions?: Prescription[];
  prescriptionsState?: ResourceState<Prescription[]>;
  totalPrescriptions?: number;
  prescriptionsLoading?: boolean;
  mrnSettings?: ClinicMrnSettings | null;
  patientCountSettings?: ClinicPatientCountSettings | null;
  onPageChange?: (page: number) => void;
  onSort?: (sort: string) => void;
  onSearch?: (search: string) => void;
  currentSort?: string;
  currentSearch?: string;
  onCliniciansPageChange?: (page: number) => void;
  onCliniciansSearch?: (search: string) => void;
  currentCliniciansSearch?: string;
  onTierUpdate?: (clinicId: string, newTier: string) => void;
  onTimezoneUpdate?: (clinicId: string, newTimezone: string) => void;
  onMrnSettingsUpdate?: (
    clinicId: string,
    mrnRequired: boolean,
    mrnUnique: boolean,
  ) => void;
  onPatientLimitUpdate?: (
    clinicId: string,
    hardLimitPlan: number | null,
  ) => void;
  onDeleteClinic?: () => void;
  onRevokeClinicianInvite?: (inviteId: string) => void;
  onRemoveClinician?: (clinicianId: string) => void;
  onRevokePatientInvite?: (inviteId: string) => void;
  isSubmitting?: boolean;
  selectedTab?: string;
  onTabChange?: (key: Key) => void;
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
  clinicianInvites = [],
  totalClinicianInvites = 0,
  clinicianInvitesLoading = false,
  prescriptions = [],
  prescriptionsState,
  totalPrescriptions = 0,
  prescriptionsLoading = false,
  mrnSettings,
  patientCountSettings,
  onPageChange,
  onSort,
  onSearch,
  currentSort,
  currentSearch,
  onCliniciansPageChange,
  onCliniciansSearch,
  currentCliniciansSearch,
  onTierUpdate,
  onTimezoneUpdate,
  onMrnSettingsUpdate,
  onPatientLimitUpdate,
  onDeleteClinic,
  onRevokeClinicianInvite,
  onRemoveClinician,
  onRevokePatientInvite,
  isSubmitting = false,
  selectedTab,
  onTabChange,
}: ClinicProfileProps) {
  const { id, shareCode, name, createdTime, canMigrate, tier, timezone } =
    clinic;
  const { locale } = useLocale();

  // Staged tier state (for 2-step save/cancel)
  const [stagedTier, setStagedTier] = useState(tier);

  // Timezone editing state
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || '');

  // MRN settings editing state
  const [mrnRequired, setMrnRequired] = useState(
    mrnSettings?.required ?? false,
  );
  const [mrnUnique, setMrnUnique] = useState(mrnSettings?.unique ?? false);

  // Patient limit state
  const [isLimitEnabled, setIsLimitEnabled] = useState(
    patientCountSettings?.hardLimit?.plan !== undefined,
  );
  const [patientLimitValue, setPatientLimitValue] = useState(
    patientCountSettings?.hardLimit?.plan?.toString() ??
      DEFAULT_PATIENT_LIMIT.toString(),
  );

  // Delete clinic modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Check if patient limits are applicable (only for tier0100)
  const isPatientLimitApplicable = tier === 'tier0100';

  // ProfileHeader configuration
  const clinicIdentifiers = [
    { label: 'ID:', value: id, monospace: true },
    ...(shareCode
      ? [{ label: 'Share Code:', value: shareCode, monospace: true }]
      : []),
  ];

  const clinicDetailFields = [
    { label: 'Tier', value: tier || '—' },
    { label: 'Can Migrate', value: canMigrate ? 'Yes' : 'No' },
    {
      label: 'Created',
      value: createdTime ? formatShortDate(createdTime, locale) : '—',
    },
  ];

  // Reset staged tier when server value changes
  useEffect(() => {
    setStagedTier(tier);
  }, [tier]);

  // Reset timezone state when it changes
  useEffect(() => {
    setSelectedTimezone(timezone || '');
  }, [timezone]);

  // Reset MRN settings when they change
  useEffect(() => {
    setMrnRequired(mrnSettings?.required ?? false);
    setMrnUnique(mrnSettings?.unique ?? false);
  }, [mrnSettings]);

  // Reset patient limit when it changes from server
  useEffect(() => {
    const hasLimit = patientCountSettings?.hardLimit?.plan !== undefined;
    setIsLimitEnabled(hasLimit);
    setPatientLimitValue(
      patientCountSettings?.hardLimit?.plan?.toString() ??
        DEFAULT_PATIENT_LIMIT.toString(),
    );
  }, [patientCountSettings]);

  // Dirty detection helpers
  const isTierDirty = stagedTier !== tier;
  const isTimezoneDirty = selectedTimezone !== (timezone || '');
  const isMrnRequiredDirty = mrnRequired !== (mrnSettings?.required ?? false);
  const isMrnUniqueDirty = mrnUnique !== (mrnSettings?.unique ?? false);
  const serverLimitEnabled =
    patientCountSettings?.hardLimit?.plan !== undefined;
  const serverLimitValue =
    patientCountSettings?.hardLimit?.plan?.toString() ??
    DEFAULT_PATIENT_LIMIT.toString();
  const isPatientLimitDirty =
    isLimitEnabled !== serverLimitEnabled ||
    (isLimitEnabled && patientLimitValue !== serverLimitValue);

  // Save handlers — call the API callbacks
  const handleTierSave = () => {
    if (onTierUpdate && stagedTier !== tier) {
      onTierUpdate(id, stagedTier);
    }
  };

  const handleTierCancel = () => {
    setStagedTier(tier);
  };

  const handleTimezoneSave = () => {
    if (onTimezoneUpdate && selectedTimezone) {
      onTimezoneUpdate(id, selectedTimezone);
    }
  };

  const handleTimezoneCancel = () => {
    setSelectedTimezone(timezone || '');
  };

  const handleMrnRequiredSave = () => {
    if (onMrnSettingsUpdate) {
      onMrnSettingsUpdate(id, mrnRequired, mrnSettings?.unique ?? false);
    }
  };

  const handleMrnRequiredCancel = () => {
    setMrnRequired(mrnSettings?.required ?? false);
  };

  const handleMrnUniqueSave = () => {
    if (onMrnSettingsUpdate) {
      onMrnSettingsUpdate(id, mrnSettings?.required ?? false, mrnUnique);
    }
  };

  const handleMrnUniqueCancel = () => {
    setMrnUnique(mrnSettings?.unique ?? false);
  };

  const handlePatientLimitSave = () => {
    if (onPatientLimitUpdate) {
      if (isLimitEnabled) {
        const value = parseInt(patientLimitValue, 10);
        onPatientLimitUpdate(id, isNaN(value) ? DEFAULT_PATIENT_LIMIT : value);
      } else {
        onPatientLimitUpdate(id, null);
      }
    }
  };

  const handlePatientLimitCancel = () => {
    setIsLimitEnabled(serverLimitEnabled);
    setPatientLimitValue(serverLimitValue);
  };

  const handleDeleteClinic = () => {
    if (onDeleteClinic) {
      onDeleteClinic();
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Clinic Details - Using ProfileHeader */}
      <ProfileHeader
        title={name}
        identifiers={clinicIdentifiers}
        detailFields={clinicDetailFields}
      />

      {/* Tabbed Interface */}
      <div className="w-full">
        <ProfileTabs
          aria-label="Clinic profile sections"
          selectedKey={selectedTab}
          onSelectionChange={onTabChange}
        >
          {/* Clinicians Tab */}
          <Tab
            key="clinicians"
            title={
              <TabTitle
                icon={UserCog}
                label="Clinicians"
                count={totalClinicians}
              />
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              <CollapsibleGroup>
                <CliniciansTable
                  clinicians={clinicians}
                  totalClinicians={totalClinicians}
                  isLoading={cliniciansLoading}
                  totalPages={cliniciansTotalPages}
                  currentPage={cliniciansCurrentPage}
                  pageSize={cliniciansPageSize}
                  onPageChange={onCliniciansPageChange}
                  onSearch={onCliniciansSearch}
                  currentSearch={currentCliniciansSearch}
                  onRemoveClinician={onRemoveClinician}
                  isFirstInGroup
                />

                <ClinicianInvitesTable
                  invites={clinicianInvites}
                  isLoading={clinicianInvitesLoading}
                  totalInvites={totalClinicianInvites}
                  onRevokeInvite={onRevokeClinicianInvite}
                />

                <RecentClinicians />
              </CollapsibleGroup>
            </div>
          </Tab>

          {/* Patients Tab */}
          <Tab
            key="patients"
            title={
              <TabTitle icon={Users} label="Patients" count={totalPatients} />
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              <CollapsibleGroup>
                <PatientsTable
                  patients={patients}
                  isLoading={patientsLoading}
                  totalPages={totalPages}
                  totalPatients={totalPatients}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onSort={onSort}
                  onSearch={onSearch}
                  currentSort={currentSort}
                  currentSearch={currentSearch}
                  clinic={clinic}
                  isFirstInGroup
                />

                <PatientInvitesTable
                  invites={patientInvites}
                  isLoading={invitesLoading}
                  totalInvites={totalInvites}
                  onRevokeInvite={onRevokePatientInvite}
                />

                <RecentPatients />
              </CollapsibleGroup>
            </div>
          </Tab>

          {/* Prescriptions Tab */}
          <Tab
            key="prescriptions"
            title={
              <TabTitle
                icon={FileText}
                label="Prescriptions"
                count={totalPrescriptions}
              />
            }
          >
            <div className="pt-6">
              <CollapsibleGroup>
                <PrescriptionsTable
                  prescriptions={prescriptions}
                  prescriptionsState={prescriptionsState}
                  totalPrescriptions={totalPrescriptions}
                  isLoading={prescriptionsLoading}
                  clinicId={id}
                  isFirstInGroup
                />
              </CollapsibleGroup>
            </div>
          </Tab>

          {/* Settings Tab */}
          <Tab
            key="settings"
            title={<TabTitle icon={Settings} label="Settings" />}
          >
            <div className="pt-6 flex flex-col gap-6">
              {/* Clinic Tier Settings */}
              <SectionPanel
                title="Clinic Tier"
                subtitle="The clinic tier determines the features and limits available to this clinic."
              >
                <div className="flex items-center gap-4">
                  <Select
                    size="sm"
                    selectedKeys={[stagedTier]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      if (key) {
                        setStagedTier(key);
                      }
                    }}
                    className="w-48"
                    classNames={{
                      trigger: 'h-10 min-h-10',
                    }}
                    isDisabled={isSubmitting}
                    aria-label="Select clinic tier"
                  >
                    {tierOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                  {isTierDirty && (
                    <SaveCancelButtons
                      onSave={handleTierSave}
                      onCancel={handleTierCancel}
                      isDisabled={isSubmitting}
                      saveAriaLabel="Save tier change"
                      cancelAriaLabel="Cancel tier change"
                    />
                  )}
                </div>
              </SectionPanel>

              {/* Patient Limit Settings */}
              <SectionPanel
                title="Patient Limit"
                subtitle="Set a maximum number of patients for this clinic. Use the toggle to enable or disable the limit."
              >
                {!isPatientLimitApplicable && (
                  <p className="text-xs text-default-500 mb-4 p-2 bg-default-100 rounded-md">
                    Patient limits only apply to tier0100 clinics. Change the
                    clinic tier to tier0100 to enable this setting.
                  </p>
                )}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <SettingsToggleRow
                        label="Limit Applied"
                        description="Enable patient count limit for this clinic"
                        isSelected={isLimitEnabled}
                        onValueChange={setIsLimitEnabled}
                        isDisabled={isSubmitting || !isPatientLimitApplicable}
                        ariaLabel="Enable patient count limit"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Maximum Patients</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        size="sm"
                        placeholder="Enter limit"
                        value={isLimitEnabled ? patientLimitValue : ''}
                        onValueChange={setPatientLimitValue}
                        className="w-40"
                        min={0}
                        step={PATIENT_LIMIT_STEP}
                        isDisabled={
                          isSubmitting ||
                          !isPatientLimitApplicable ||
                          !isLimitEnabled
                        }
                      />
                      <span className="text-sm text-default-500">patients</span>
                      {isPatientLimitApplicable && isPatientLimitDirty && (
                        <SaveCancelButtons
                          onSave={handlePatientLimitSave}
                          onCancel={handlePatientLimitCancel}
                          isDisabled={isSubmitting}
                          saveAriaLabel="Save patient limit changes"
                          cancelAriaLabel="Cancel patient limit changes"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </SectionPanel>

              {/* Timezone Settings */}
              <SectionPanel title="Timezone">
                <div className="flex items-center gap-4">
                  <Autocomplete
                    size="sm"
                    selectedKey={selectedTimezone || null}
                    onSelectionChange={(key) => {
                      if (key !== null) {
                        setSelectedTimezone(key as string);
                      }
                    }}
                    className="w-80"
                    isDisabled={isSubmitting}
                    placeholder="Select timezone..."
                    aria-label="Select timezone"
                    defaultInputValue={selectedTimezone}
                  >
                    {timezoneNames.map((tz) => (
                      <AutocompleteItem key={tz}>{tz}</AutocompleteItem>
                    ))}
                  </Autocomplete>
                  {isTimezoneDirty && (
                    <SaveCancelButtons
                      onSave={handleTimezoneSave}
                      onCancel={handleTimezoneCancel}
                      isDisabled={isSubmitting}
                      saveAriaLabel="Save timezone change"
                      cancelAriaLabel="Cancel timezone change"
                    />
                  )}
                </div>
              </SectionPanel>

              {/* MRN Settings */}
              <SectionPanel title="MRN Settings">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <SettingsToggleRow
                        label="MRN Required"
                        description="Require MRN when creating or updating patients"
                        isSelected={mrnRequired}
                        onValueChange={setMrnRequired}
                        isDisabled={isSubmitting}
                        ariaLabel="MRN required"
                      />
                    </div>
                    {isMrnRequiredDirty && (
                      <SaveCancelButtons
                        onSave={handleMrnRequiredSave}
                        onCancel={handleMrnRequiredCancel}
                        isDisabled={isSubmitting}
                        saveAriaLabel="Save MRN required change"
                        cancelAriaLabel="Cancel MRN required change"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <SettingsToggleRow
                        label="MRN Unique"
                        description="Enforce MRN uniqueness constraint"
                        isSelected={mrnUnique}
                        onValueChange={setMrnUnique}
                        isDisabled={isSubmitting}
                        ariaLabel="MRN unique"
                      />
                    </div>
                    {isMrnUniqueDirty && (
                      <SaveCancelButtons
                        onSave={handleMrnUniqueSave}
                        onCancel={handleMrnUniqueCancel}
                        isDisabled={isSubmitting}
                        saveAriaLabel="Save MRN unique change"
                        cancelAriaLabel="Cancel MRN unique change"
                      />
                    )}
                  </div>
                </div>
              </SectionPanel>

              {/* Danger Zone */}
              <SectionPanel title="Danger Zone">
                <DangerZoneSection>
                  <DangerZoneAction
                    title="Delete Clinic Workspace"
                    description="Permanently delete this clinic and all associated data. This action cannot be undone."
                    actionButton={
                      <Button
                        color="danger"
                        variant="flat"
                        size="sm"
                        startContent={<Trash2 size={14} />}
                        onPress={() => setIsDeleteModalOpen(true)}
                      >
                        Delete Clinic
                      </Button>
                    }
                  />
                </DangerZoneSection>
              </SectionPanel>
            </div>
          </Tab>
        </ProfileTabs>
      </div>

      {/* Delete Clinic Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteClinic}
        title="Delete Clinic Workspace"
        description={`Are you sure you want to delete "${name}"? This will permanently remove the clinic and all associated data. This action cannot be undone.`}
        confirmText="Delete Clinic"
        confirmVariant="danger"
      />
    </div>
  );
}
