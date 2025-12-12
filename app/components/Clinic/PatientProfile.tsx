import { useRouteLoaderData, Link } from 'react-router';
import { useCallback } from 'react';
import { Tabs, Tab } from '@heroui/react';
import { Database, Smartphone, FileText, ExternalLink } from 'lucide-react';
import Well from '~/partials/Well';

import type { Patient, Prescription } from './types';
import type { DataSet, DataSource, PumpSettings } from '../User/types';
import useLocale from '~/hooks/useLocale';
import PrescriptionsTable from './PrescriptionsTable';
import DataSetsTable from '../User/DataSetsTable';
import ProfileHeader from '~/components/ui/ProfileHeader';
import DataSourcesTable from '../User/DataSourcesTable';
import DataExportSection from '../User/DataExportSection';
import PumpSettingsSection from '../User/PumpSettingsSection';
import { formatShortDate } from '~/utils/dateFormatters';

export type PatientProfileProps = {
  patient: Patient;
  prescriptions?: Prescription[];
  totalPrescriptions?: number;
  prescriptionsLoading?: boolean;
  clinicId?: string;
  clinic?: {
    patientTags?: {
      id: string;
      name: string;
    }[];
    sites?: {
      id: string;
      name: string;
    }[];
  };
  // Data tab props
  dataSets?: DataSet[];
  totalDataSets?: number;
  dataSources?: DataSource[];
  totalDataSources?: number;
  // Device tab props
  pumpSettings?: PumpSettings[];
  isPumpSettingsLoading?: boolean;
};

export default function PatientProfile({
  patient,
  prescriptions = [],
  totalPrescriptions = 0,
  prescriptionsLoading = false,
  clinicId,
  clinic,
  dataSets = [],
  totalDataSets = 0,
  dataSources = [],
  totalDataSources = 0,
  pumpSettings = [],
  isPumpSettingsLoading = false,
}: PatientProfileProps) {
  const {
    id,
    fullName,
    email,
    birthDate,
    mrn,
    createdTime,
    updatedTime,
    tags,
    permissions,
  } = patient;
  const { locale } = useLocale();

  // Try to get clinic data from parent route if not provided as prop
  const parentRouteData = useRouteLoaderData('routes/clinics.$clinicId') as
    | {
        clinic?: {
          patientTags?: { id: string; name: string }[];
          sites?: { id: string; name: string }[];
        };
      }
    | undefined;
  const clinicData = clinic || parentRouteData?.clinic;

  // Helper function to map tag ID to tag name
  const getTagName = useCallback(
    (tagId: string): string => {
      const tag = clinicData?.patientTags?.find((t) => t.id === tagId);
      return tag?.name || tagId; // Fallback to ID if name not found
    },
    [clinicData?.patientTags],
  );

  // Helper function to map site ID to site name
  const getSiteName = useCallback(
    (siteId: string): string => {
      const site = clinicData?.sites?.find((s) => s.id === siteId);
      return site?.name || siteId; // Fallback to ID if name not found
    },
    [clinicData?.sites],
  );

  // ProfileHeader configuration
  const patientIdentifiers = [
    ...(email ? [{ value: email }] : []),
    { label: 'ID:', value: id, monospace: true },
    ...(mrn ? [{ label: 'MRN:', value: mrn, monospace: true }] : []),
  ];

  const patientDetailFields = [
    {
      label: 'Birth Date',
      value: birthDate ? formatShortDate(birthDate, locale) : '—',
    },
    { label: 'Added', value: formatShortDate(createdTime, locale) },
    { label: 'Last Updated', value: formatShortDate(updatedTime, locale) },
    ...(permissions
      ? [
          {
            label: 'Permissions',
            value: (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {permissions.view && (
                  <span className="px-1.5 py-0.5 bg-success/10 text-success rounded text-xs">
                    View
                  </span>
                )}
                {permissions.upload && (
                  <span className="px-1.5 py-0.5 bg-warning/10 text-warning rounded text-xs">
                    Upload
                  </span>
                )}
                {permissions.note && (
                  <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary rounded text-xs">
                    Note
                  </span>
                )}
              </div>
            ),
          },
        ]
      : []),
    ...(tags && tags.length > 0
      ? [
          {
            label: 'Tags',
            value: (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {tags.map((tagId, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs"
                  >
                    {getTagName(tagId)}
                  </span>
                ))}
              </div>
            ),
          },
        ]
      : []),
    ...(patient.sites && patient.sites.length > 0
      ? [
          {
            label: 'Sites',
            value: (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {patient.sites.map((site, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-secondary/10 text-secondary rounded text-xs"
                  >
                    {getSiteName(site.id || site.name || String(site))}
                  </span>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  const viewUserAccountLink = (
    <Link
      to={`/users/${id}`}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-default-500 hover:text-foreground hover:bg-default/40 transition-all"
      aria-label="View user account"
    >
      <span className="text-default-400">View User Account</span>
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </Link>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <ProfileHeader
        title={fullName}
        identifiers={patientIdentifiers}
        actionLink={viewUserAccountLink}
        detailFields={patientDetailFields}
      />

      <div className="w-full">
        <Tabs
          aria-label="Patient profile sections"
          variant="underlined"
          classNames={{
            tabList:
              'gap-4 w-full relative rounded-none p-0 border-b border-divider',
            cursor: 'w-full bg-primary',
            tab: 'max-w-fit px-2 h-12',
            tabContent: 'group-data-[selected=true]:text-primary',
          }}
        >
          {/* Data Tab */}
          <Tab
            key="data"
            title={
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Data</span>
                {totalDataSets > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {totalDataSets}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              <DataSetsTable
                dataSets={dataSets}
                totalDataSets={totalDataSets}
              />
              <DataSourcesTable
                dataSources={dataSources}
                totalDataSources={totalDataSources}
              />
              <Well>
                <DataExportSection userId={id} />
              </Well>
            </div>
          </Tab>

          {/* Device Tab */}
          <Tab
            key="device"
            title={
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Device</span>
                {pumpSettings.length > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {pumpSettings.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6">
              <PumpSettingsSection
                pumpSettings={pumpSettings}
                isLoading={isPumpSettingsLoading}
              />
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
              <PrescriptionsTable
                prescriptions={prescriptions}
                totalPrescriptions={totalPrescriptions}
                isLoading={prescriptionsLoading}
                clinicId={clinicId}
              />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
