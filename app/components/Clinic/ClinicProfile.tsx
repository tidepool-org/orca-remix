import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectItem,
  Button,
  Tabs,
  Tab,
  Switch,
  Input,
} from '@heroui/react';
import {
  Edit2,
  X,
  Users,
  UserCog,
  FileText,
  Clock,
  Settings,
  Trash2,
  Check,
} from 'lucide-react';

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
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';
import PatientsTable from './PatientsTable';
import PatientInvitesTable from './PatientInvitesTable';
import CliniciansTable from './CliniciansTable';
import ClinicianInvitesTable from './ClinicianInvitesTable';
import PrescriptionsTable from './PrescriptionsTable';
import RecentPatients from './RecentPatients';
import RecentClinicians from './RecentClinicians';
import ConfirmationModal from '../ConfirmationModal';

// Common timezones for selection
const timezoneOptions = [
  { key: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { key: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { key: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { key: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { key: 'America/Anchorage', label: 'Alaska' },
  { key: 'Pacific/Honolulu', label: 'Hawaii' },
  { key: 'America/Phoenix', label: 'Arizona' },
  { key: 'America/Puerto_Rico', label: 'Atlantic Time (Puerto Rico)' },
  { key: 'Europe/London', label: 'London' },
  { key: 'Europe/Paris', label: 'Paris' },
  { key: 'Europe/Berlin', label: 'Berlin' },
  { key: 'Asia/Tokyo', label: 'Tokyo' },
  { key: 'Asia/Shanghai', label: 'Shanghai' },
  { key: 'Australia/Sydney', label: 'Sydney' },
  { key: 'UTC', label: 'UTC' },
];

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
  isSubmitting?: boolean;
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
  isSubmitting = false,
}: ClinicProfileProps) {
  const { id, shareCode, name, createdTime, canMigrate, tier, timezone } =
    clinic;
  const { locale } = useLocale();

  // Tier editing state
  const [isEditingTier, setIsEditingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState(tier);

  // Timezone editing state
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || '');

  // MRN settings editing state
  const [mrnRequired, setMrnRequired] = useState(
    mrnSettings?.required ?? false,
  );
  const [mrnUnique, setMrnUnique] = useState(mrnSettings?.unique ?? false);

  // Patient limit editing state
  const [isEditingPatientLimit, setIsEditingPatientLimit] = useState(false);
  const [patientLimitValue, setPatientLimitValue] = useState(
    patientCountSettings?.hardLimit?.plan?.toString() ?? '',
  );

  // Delete clinic modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Reset editing state when tier changes (after successful update)
  useEffect(() => {
    if (!isSubmitting && selectedTier !== tier) {
      setSelectedTier(tier);
      setIsEditingTier(false);
    }
  }, [tier, selectedTier, isSubmitting]);

  // Reset timezone state when it changes
  useEffect(() => {
    setSelectedTimezone(timezone || '');
    setIsEditingTimezone(false);
  }, [timezone]);

  // Reset MRN settings when they change
  useEffect(() => {
    setMrnRequired(mrnSettings?.required ?? false);
    setMrnUnique(mrnSettings?.unique ?? false);
  }, [mrnSettings]);

  // Reset patient limit when it changes
  useEffect(() => {
    setPatientLimitValue(
      patientCountSettings?.hardLimit?.plan?.toString() ?? '',
    );
    setIsEditingPatientLimit(false);
  }, [patientCountSettings]);

  const tierOptions = [
    { key: 'tier0100', label: 'Tier 0100' },
    { key: 'tier0200', label: 'Tier 0200' },
    { key: 'tier0300', label: 'Tier 0300' },
    { key: 'tier0400', label: 'Tier 0400' },
  ];

  const handleCancelTierEdit = () => {
    setSelectedTier(tier);
    setIsEditingTier(false);
  };

  const handleCancelTimezoneEdit = () => {
    setSelectedTimezone(timezone || '');
    setIsEditingTimezone(false);
  };

  const handleMrnSettingsChange = (
    newRequired: boolean,
    newUnique: boolean,
  ) => {
    if (onMrnSettingsUpdate) {
      onMrnSettingsUpdate(id, newRequired, newUnique);
    }
  };

  const handlePatientLimitSave = () => {
    if (onPatientLimitUpdate) {
      const value =
        patientLimitValue === '' ? null : parseInt(patientLimitValue, 10);
      onPatientLimitUpdate(id, value);
    }
    setIsEditingPatientLimit(false);
  };

  const handlePatientLimitCancel = () => {
    setPatientLimitValue(
      patientCountSettings?.hardLimit?.plan?.toString() ?? '',
    );
    setIsEditingPatientLimit(false);
  };

  const handleDeleteClinic = () => {
    if (onDeleteClinic) {
      onDeleteClinic();
    }
    setIsDeleteModalOpen(false);
  };

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
    {
      label: 'Clinic Tier',
      value: tier,
      editable: true,
      component: (
        <div className="flex items-center gap-2">
          {isEditingTier ? (
            <div className="flex items-center gap-2">
              <Select
                size="sm"
                selectedKeys={[selectedTier]}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  if (key && key !== tier) {
                    setSelectedTier(key);
                    // Auto-submit when selection changes
                    if (onTierUpdate) {
                      onTierUpdate(id, key);
                    }
                  }
                }}
                className="w-40"
                classNames={{
                  trigger: 'h-8 min-h-8',
                }}
                isDisabled={isSubmitting}
                placeholder="Select tier..."
              >
                {tierOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleCancelTierEdit}
                isDisabled={isSubmitting}
                aria-label="Cancel tier edit"
              >
                <X size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{tier}</span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsEditingTier(true)}
                aria-label="Edit clinic tier"
              >
                <Edit2 size={14} />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    { label: 'Can Migrate', value: canMigrate.toString() },
    {
      label: 'Created On',
      value: createdTime
        ? (() => {
            const date = new Date(createdTime);
            return isNaN(date.getTime())
              ? createdTime
              : intlFormat(
                  date,
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                  { locale },
                );
          })()
        : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Clinic Details - Always visible */}
      <Well>
        <h1 className="text-xl">{name}</h1>

        <div className="text-sm">
          {clinicDetails.map(({ label, value, copy, component }, i) => (
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

      {/* Tabbed Interface */}
      <div className="w-full">
        <Tabs
          aria-label="Clinic profile sections"
          variant="underlined"
          classNames={{
            tabList:
              'gap-4 w-full relative rounded-none p-0 border-b border-divider',
            cursor: 'w-full bg-primary',
            tab: 'max-w-fit px-2 h-12',
            tabContent: 'group-data-[selected=true]:text-primary',
          }}
        >
          {/* Patients Tab */}
          <Tab
            key="patients"
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Patients</span>
                {totalPatients > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {totalPatients}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6 flex flex-col gap-6">
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
                  onSearch={onSearch}
                  currentSort={currentSort}
                  currentSearch={currentSearch}
                  clinic={clinic}
                />
              </Well>

              <Well>
                <PatientInvitesTable
                  invites={patientInvites}
                  isLoading={invitesLoading}
                  totalInvites={totalInvites}
                />
              </Well>
            </div>
          </Tab>

          {/* Clinicians Tab */}
          <Tab
            key="clinicians"
            title={
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                <span>Clinicians</span>
                {totalClinicians > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {totalClinicians}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              <Well>
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
                />
              </Well>

              <Well>
                <ClinicianInvitesTable
                  invites={clinicianInvites}
                  isLoading={clinicianInvitesLoading}
                  totalInvites={totalClinicianInvites}
                />
              </Well>
            </div>
          </Tab>

          {/* Prescriptions Tab */}
          <Tab
            key="prescriptions"
            title={
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Prescriptions</span>
                {totalPrescriptions > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {totalPrescriptions}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6">
              <Well>
                <PrescriptionsTable
                  prescriptions={prescriptions}
                  totalPrescriptions={totalPrescriptions}
                  isLoading={prescriptionsLoading}
                  clinicId={id}
                />
              </Well>
            </div>
          </Tab>

          {/* Settings Tab */}
          <Tab
            key="settings"
            title={
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              {/* Timezone Settings */}
              <Well>
                <h2 className="text-lg font-medium mb-4">Timezone</h2>
                <div className="flex items-center gap-4">
                  {isEditingTimezone ? (
                    <div className="flex items-center gap-2">
                      <Select
                        size="sm"
                        selectedKeys={
                          selectedTimezone ? [selectedTimezone] : []
                        }
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0] as string;
                          if (key) {
                            setSelectedTimezone(key);
                            if (onTimezoneUpdate) {
                              onTimezoneUpdate(id, key);
                            }
                          }
                        }}
                        className="w-80"
                        classNames={{
                          trigger: 'h-10 min-h-10',
                        }}
                        isDisabled={isSubmitting}
                        placeholder="Select timezone..."
                      >
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={handleCancelTimezoneEdit}
                        isDisabled={isSubmitting}
                        aria-label="Cancel timezone edit"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {timezone ||
                          timezoneOptions.find((t) => t.key === timezone)
                            ?.label ||
                          'Not set'}
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setIsEditingTimezone(true)}
                        aria-label="Edit timezone"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </Well>

              {/* MRN Settings */}
              <Well>
                <h2 className="text-lg font-medium mb-4">MRN Settings</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">MRN Required</p>
                      <p className="text-xs text-default-500">
                        Require MRN when creating or updating patients
                      </p>
                    </div>
                    <Switch
                      isSelected={mrnRequired}
                      onValueChange={(value) => {
                        setMrnRequired(value);
                        handleMrnSettingsChange(value, mrnUnique);
                      }}
                      isDisabled={isSubmitting}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">MRN Unique</p>
                      <p className="text-xs text-default-500">
                        Enforce MRN uniqueness constraint
                      </p>
                    </div>
                    <Switch
                      isSelected={mrnUnique}
                      onValueChange={(value) => {
                        setMrnUnique(value);
                        handleMrnSettingsChange(mrnRequired, value);
                      }}
                      isDisabled={isSubmitting}
                      size="sm"
                    />
                  </div>
                </div>
              </Well>

              {/* Patient Limit Settings */}
              <Well>
                <h2 className="text-lg font-medium mb-4">Patient Limit</h2>
                <div className="flex items-center gap-4">
                  {isEditingPatientLimit ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        size="sm"
                        placeholder="Enter limit (leave empty for no limit)"
                        value={patientLimitValue}
                        onValueChange={setPatientLimitValue}
                        className="w-64"
                        min={0}
                        isDisabled={isSubmitting}
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={handlePatientLimitSave}
                        isDisabled={isSubmitting}
                        aria-label="Save patient limit"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={handlePatientLimitCancel}
                        isDisabled={isSubmitting}
                        aria-label="Cancel patient limit edit"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {patientCountSettings?.hardLimit?.plan !== undefined
                          ? `${patientCountSettings.hardLimit.plan} patients`
                          : 'No limit'}
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setIsEditingPatientLimit(true)}
                        aria-label="Edit patient limit"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-default-500 mt-2">
                  Set a maximum number of patients for this clinic. Leave empty
                  to remove the limit.
                </p>
              </Well>

              {/* Danger Zone */}
              <Well>
                <h2 className="text-lg font-medium mb-4 text-danger">
                  Danger Zone
                </h2>
                <div className="flex items-center justify-between p-4 border border-danger rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      Delete Clinic Workspace
                    </p>
                    <p className="text-xs text-default-500">
                      Permanently delete this clinic and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    startContent={<Trash2 size={14} />}
                    onPress={() => setIsDeleteModalOpen(true)}
                  >
                    Delete Clinic
                  </Button>
                </div>
              </Well>
            </div>
          </Tab>

          {/* Recent Activity Tab */}
          <Tab
            key="recent"
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </div>
            }
          >
            <div className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentPatients />
                <RecentClinicians />
              </div>
            </div>
          </Tab>
        </Tabs>
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
