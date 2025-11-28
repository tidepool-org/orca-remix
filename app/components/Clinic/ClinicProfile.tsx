import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import { useState, useEffect } from 'react';
import { Select, SelectItem, Button } from "@heroui/react";
import { Edit2, X } from 'lucide-react';

import type { Clinic, Patient, PatientInvite, Clinician } from './types';
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
  onPageChange?: (page: number) => void;
  onSort?: (sort: string) => void;
  onSearch?: (search: string) => void;
  currentSort?: string;
  currentSearch?: string;
  onCliniciansPageChange?: (page: number) => void;
  onCliniciansSearch?: (search: string) => void;
  currentCliniciansSearch?: string;
  onTierUpdate?: (clinicId: string, newTier: string) => void;
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
  onPageChange,
  onSort,
  onSearch,
  currentSort,
  currentSearch,
  onCliniciansPageChange,
  onCliniciansSearch,
  currentCliniciansSearch,
  onTierUpdate,
  isSubmitting = false,
}: ClinicProfileProps) {
  const { id, shareCode, name, createdTime, canMigrate, tier } = clinic;
  const { locale } = useLocale();
  const [isEditingTier, setIsEditingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState(tier);

  // Reset editing state when tier changes (after successful update)
  useEffect(() => {
    if (!isSubmitting && selectedTier !== tier) {
      setSelectedTier(tier);
      setIsEditingTier(false);
    }
  }, [tier, selectedTier, isSubmitting]);

  const tierOptions = [
    { key: 'tier0100', label: 'Tier 0100' },
    { key: 'tier0200', label: 'Tier 0200' },
    { key: 'tier0300', label: 'Tier 0300' },
    { key: 'tier0400', label: 'Tier 0400' },
  ];

  const handleCancelEdit = () => {
    setSelectedTier(tier);
    setIsEditingTier(false);
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
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleCancelEdit}
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
    <div className="flex flex-col gap-8 w-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentPatients />
        <RecentClinicians />
      </div>
    </div>
  );
}
