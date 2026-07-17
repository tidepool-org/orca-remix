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
  Switch,
} from '@heroui/react';
import {
  Users,
  UserCog,
  FileText,
  Settings,
  Trash2,
  Sun,
  Check,
} from 'lucide-react';
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
import useProfileExpanded from '~/hooks/useProfileExpanded';
import PatientsTable from './PatientsTable';
import PatientInvitesTable from './PatientInvitesTable';
import CliniciansTable from './CliniciansTable';
import ClinicianInvitesTable from './ClinicianInvitesTable';
import PrescriptionsTable from './PrescriptionsTable';
import RecentPatients from './RecentPatients';
import RecentClinicians from './RecentClinicians';
import RecentPrescriptions from './RecentPrescriptions';
import ConfirmationModal from '../ui/ConfirmationModal';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
import { DangerZoneAction } from '~/components/ui/DangerZoneSection';
import SectionPanel from '~/components/ui/SectionPanel';
import SettingRow from '~/components/ui/SettingRow';
import { CollapsibleGroup } from '~/components/ui/CollapsibleGroup';
import { timezoneNames } from '~/utils/timezoneNames';

const tierOptions = [
  { key: 'tier0100', label: 'Tier 0100' },
  { key: 'tier0200', label: 'Tier 0200' },
  { key: 'tier0300', label: 'Tier 0300' },
  { key: 'tier0400', label: 'Tier 0400' },
];

const DEFAULT_PATIENT_LIMIT = 250;

/**
 * The hard patient-count limit, tolerating the legacy `patientCount` field
 * (since renamed to `plan`). Mirrors blip's read fallback so clinics whose
 * limit was stored under the old key still display. We only ever write `plan`.
 */
function readHardLimitPlan(
  settings?: ClinicPatientCountSettings | null,
): number | undefined {
  return settings?.hardLimit?.plan ?? settings?.hardLimit?.patientCount;
}

/** Only the settings the user changed are included, so the combined save
 *  touches only the endpoints whose value actually changed. */
export type ClinicSettingsPayload = {
  tier?: string;
  timezone?: string;
  mrnRequired?: boolean;
  mrnUnique?: boolean;
  /** number = set the limit; null = remove the limit */
  hardLimitPlan?: number | null;
};

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
  onSaveClinicSettings?: (
    clinicId: string,
    payload: ClinicSettingsPayload,
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
  onSaveClinicSettings,
  onDeleteClinic,
  onRevokeClinicianInvite,
  onRemoveClinician,
  onRevokePatientInvite,
  isSubmitting = false,
  selectedTab,
  onTabChange,
}: ClinicProfileProps) {
  const {
    id,
    shareCode,
    name,
    createdTime,
    tier,
    timezone,
    address,
    city,
    state,
    postalCode,
    country,
  } = clinic;
  const { locale } = useLocale();
  const profileExpandedProps = useProfileExpanded('clinic');

  // Staged tier state (for 2-step save/cancel)
  const [stagedTier, setStagedTier] = useState(tier);

  // Timezone editing state
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || '');

  // MRN settings editing state
  const [mrnRequired, setMrnRequired] = useState(
    mrnSettings?.required ?? false,
  );
  const [mrnUnique, setMrnUnique] = useState(mrnSettings?.unique ?? false);

  // Patient limit state — an empty value means "no limit". The old separate
  // "Limit Applied" toggle is collapsed into the empty/disabled input state.
  const [patientLimitValue, setPatientLimitValue] = useState(
    readHardLimitPlan(patientCountSettings)?.toString() ?? '',
  );

  // Delete clinic modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Patient limits apply only to US-based tier0100 clinics — no other
  // country or tier can have a limit. Gate on the *staged* tier (so the
  // controls track the tier the user is choosing and no limit is sent for a
  // non-tier0100 tier) and on the clinic's country.
  const isUsBased = country === 'US';
  const isPatientLimitApplicable = stagedTier === 'tier0100' && isUsBased;

  // ProfileHeader configuration
  const clinicIdentifiers = [
    { label: 'ID:', value: id, monospace: true },
    ...(shareCode
      ? [{ label: 'Share Code:', value: shareCode, monospace: true }]
      : []),
  ];

  const addressLine =
    [address, [city, state].filter(Boolean).join(' '), postalCode, country]
      .filter(Boolean)
      .join(', ') || '—';

  const clinicDetailFields = [
    { label: 'Tier', value: tier || '—' },
    { label: 'Address', value: addressLine },
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

  // Reset each MRN toggle independently when its own server value changes.
  // Keying both off the whole mrnSettings object would reset an unrelated,
  // still-unsaved toggle whenever the other was saved — silently discarding
  // the user's pending edit.
  useEffect(() => {
    setMrnRequired(mrnSettings?.required ?? false);
  }, [mrnSettings?.required]);

  useEffect(() => {
    setMrnUnique(mrnSettings?.unique ?? false);
  }, [mrnSettings?.unique]);

  // Reset patient limit when it changes from server
  useEffect(() => {
    setPatientLimitValue(
      readHardLimitPlan(patientCountSettings)?.toString() ?? '',
    );
  }, [patientCountSettings]);

  // Dirty detection helpers
  const serverLimitValue =
    readHardLimitPlan(patientCountSettings)?.toString() ?? '';
  const isTierDirty = stagedTier !== tier;
  const isTimezoneDirty = selectedTimezone !== (timezone || '');
  const isMrnRequiredDirty = mrnRequired !== (mrnSettings?.required ?? false);
  const isMrnUniqueDirty = mrnUnique !== (mrnSettings?.unique ?? false);
  const isPatientLimitDirty =
    isPatientLimitApplicable && patientLimitValue.trim() !== serverLimitValue;

  const isDirty =
    isTierDirty ||
    isTimezoneDirty ||
    isMrnRequiredDirty ||
    isMrnUniqueDirty ||
    isPatientLimitDirty;

  // Reset every staged value back to its loader source.
  const handleReset = () => {
    setStagedTier(tier);
    setSelectedTimezone(timezone || '');
    setMrnRequired(mrnSettings?.required ?? false);
    setMrnUnique(mrnSettings?.unique ?? false);
    setPatientLimitValue(serverLimitValue);
  };

  // Save every changed setting in one submit. Only dirty fields are included
  // so the combined action calls only the endpoints that need it. MRN required
  // and unique share one endpoint, so both are sent whenever either changed.
  const handleSaveClinicSettings = () => {
    if (!onSaveClinicSettings || !isDirty) return;

    const payload: ClinicSettingsPayload = {};
    if (isTierDirty) payload.tier = stagedTier;
    if (isTimezoneDirty) payload.timezone = selectedTimezone;
    if (isMrnRequiredDirty || isMrnUniqueDirty) {
      payload.mrnRequired = mrnRequired;
      payload.mrnUnique = mrnUnique;
    }
    if (isPatientLimitDirty) {
      const trimmed = patientLimitValue.trim();
      const value = parseInt(trimmed, 10);
      payload.hardLimitPlan =
        trimmed === '' || isNaN(value) || value < 0 ? null : value;
    }

    onSaveClinicSettings(id, payload);
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
        {...profileExpandedProps}
      />

      {/* Tabbed Interface */}
      <div className="w-full">
        <ProfileTabs
          aria-label="Clinic profile sections"
          selectedKey={selectedTab}
          onSelectionChange={onTabChange}
        >
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
            <div className="pt-6 flex flex-col gap-6">
              <CollapsibleGroup>
                <PrescriptionsTable
                  prescriptions={prescriptions}
                  prescriptionsState={prescriptionsState}
                  totalPrescriptions={totalPrescriptions}
                  isLoading={prescriptionsLoading}
                  clinicId={id}
                  isFirstInGroup
                />

                <RecentPrescriptions />
              </CollapsibleGroup>
            </div>
          </Tab>

          {/* Settings Tab */}
          <Tab
            key="settings"
            title={<TabTitle icon={Settings} label="Settings" />}
          >
            <div className="pt-6 flex flex-col gap-6">
              {/* Clinic Settings — one consolidated panel of hairline rows */}
              <SectionPanel
                icon={<Sun />}
                title="Clinic Settings"
                aria-label="Clinic Settings"
              >
                <div className="flex flex-col">
                  <SettingRow
                    label="Tier"
                    description="Subscription tier — controls feature access and limits."
                    control={
                      <Select
                        size="sm"
                        selectedKeys={[stagedTier]}
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0] as string;
                          if (key) {
                            setStagedTier(key);
                          }
                        }}
                        className="w-[230px]"
                        classNames={{ trigger: 'h-10 min-h-10' }}
                        isDisabled={isSubmitting}
                        aria-label="Select clinic tier"
                      >
                        {tierOptions.map((option) => (
                          <SelectItem key={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    }
                  />

                  <SettingRow
                    label="Patient Limit"
                    description={
                      <>
                        Maximum number of patients this clinic may enroll. Leave
                        empty for no limit.
                        <br />
                        Only applies to US-based tier 0100 clinics.
                      </>
                    }
                    control={
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() =>
                            setPatientLimitValue(String(DEFAULT_PATIENT_LIMIT))
                          }
                          isDisabled={
                            isSubmitting ||
                            !isPatientLimitApplicable ||
                            patientLimitValue.trim() ===
                              String(DEFAULT_PATIENT_LIMIT)
                          }
                          aria-label={`Set patient limit to default of ${DEFAULT_PATIENT_LIMIT}`}
                        >
                          Set default ({DEFAULT_PATIENT_LIMIT})
                        </Button>
                        <Input
                          type="number"
                          size="sm"
                          placeholder="No limit"
                          aria-label="Maximum patients"
                          value={patientLimitValue}
                          onValueChange={setPatientLimitValue}
                          className="w-[150px]"
                          min={0}
                          step={1}
                          isDisabled={isSubmitting || !isPatientLimitApplicable}
                        />
                      </div>
                    }
                  />

                  <SettingRow
                    label="Timezone"
                    description="Default timezone for reports and timestamps."
                    control={
                      <Autocomplete
                        size="sm"
                        selectedKey={selectedTimezone || null}
                        onSelectionChange={(key) => {
                          if (key !== null) {
                            setSelectedTimezone(key as string);
                          }
                        }}
                        className="w-[230px]"
                        isDisabled={isSubmitting}
                        placeholder="Select timezone..."
                        aria-label="Select timezone"
                        defaultInputValue={selectedTimezone}
                      >
                        {timezoneNames.map((tz) => (
                          <AutocompleteItem key={tz}>{tz}</AutocompleteItem>
                        ))}
                      </Autocomplete>
                    }
                  />

                  <SettingRow
                    label="Require MRN"
                    description="Require a Medical Record Number when adding patients."
                    control={
                      <Switch
                        size="sm"
                        isSelected={mrnRequired}
                        onValueChange={setMrnRequired}
                        isDisabled={isSubmitting}
                        aria-label="Require MRN"
                      />
                    }
                  />

                  <SettingRow
                    label="Unique MRN"
                    description="Enforce that each patient's MRN is unique."
                    control={
                      <Switch
                        size="sm"
                        isSelected={mrnUnique}
                        onValueChange={setMrnUnique}
                        isDisabled={isSubmitting}
                        aria-label="Unique MRN"
                      />
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-1 border-t border-[color:var(--border)]">
                  <Button
                    variant="flat"
                    onPress={handleReset}
                    isDisabled={!isDirty || isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    color="primary"
                    startContent={<Check size={16} aria-hidden="true" />}
                    onPress={handleSaveClinicSettings}
                    isDisabled={!isDirty || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </SectionPanel>

              {/* Danger Zone */}
              <SectionPanel
                title="Danger Zone"
                titleClassName="text-[color:var(--danger)]"
                tone="danger"
                collapsible
                defaultExpanded={false}
              >
                <DangerZoneAction
                  title="Delete Clinic Workspace"
                  description="Permanently delete this clinic and all associated data. This action cannot be undone."
                  actionButton={
                    <Button
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<Trash2 size={14} aria-hidden="true" />}
                      onPress={() => setIsDeleteModalOpen(true)}
                    >
                      Delete Clinic
                    </Button>
                  }
                />
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
