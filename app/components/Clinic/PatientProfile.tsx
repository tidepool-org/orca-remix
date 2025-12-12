import { useRouteLoaderData, Link } from 'react-router';
import { useCallback, useState } from 'react';
import { Tabs, Tab } from '@heroui/react';
import {
  Database,
  Smartphone,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';

import type { Patient, Prescription } from './types';
import type { DataSet, DataSource, PumpSettings } from '../User/types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';
import PrescriptionsTable from './PrescriptionsTable';
import DataSetsTable from '../User/DataSetsTable';
import DataSourcesTable from '../User/DataSourcesTable';
import DataExportSection from '../User/DataExportSection';
import PumpSettingsSection from '../User/PumpSettingsSection';

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

  // State for collapsible details (Option 3)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Patient details component - Option 3: Collapsible details layout
  const PatientDetailsSection = (
    <Well className="!gap-0">
      {/* Row 1: Name on left, toggle button on right */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{fullName}</h1>
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 transition-colors"
          aria-expanded={isDetailsExpanded}
          aria-label={isDetailsExpanded ? 'Hide details' : 'Show details'}
        >
          <span>{isDetailsExpanded ? 'Hide Details' : 'Show Details'}</span>
          {isDetailsExpanded ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Row 2: Copyable identifiers - order: email, ID, MRN, then View User Account link */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
        {email && (
          <span className="flex items-center gap-1">
            <span className="text-default-600">{email}</span>
            <ClipboardButton clipboardText={email} />
          </span>
        )}
        <span className="flex items-center gap-1 text-default-500">
          <span className="text-default-400">ID:</span>
          <span className="font-mono text-xs">{id}</span>
          <ClipboardButton clipboardText={id} />
        </span>
        {mrn && (
          <span className="flex items-center gap-1 text-default-500">
            <span className="text-default-400">MRN:</span>
            <span className="font-mono text-xs">{mrn}</span>
            <ClipboardButton clipboardText={mrn} />
          </span>
        )}
        <Link
          to={`/users/${id}`}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-default-500 hover:text-foreground hover:bg-default/40 transition-all"
          aria-label="View user account"
        >
          <span>View User Account</span>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Collapsible details section */}
      {isDetailsExpanded && (
        <div className="mt-4 pt-4 border-t border-divider">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-default-400 block text-xs">Birth Date</span>
              <span className="text-default-600">
                {birthDate
                  ? intlFormat(
                      new Date(birthDate),
                      { year: 'numeric', month: 'short', day: 'numeric' },
                      { locale },
                    )
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-default-400 block text-xs">Added</span>
              <span className="text-default-600">
                {intlFormat(
                  new Date(createdTime),
                  { year: 'numeric', month: 'short', day: 'numeric' },
                  { locale },
                )}
              </span>
            </div>
            <div>
              <span className="text-default-400 block text-xs">
                Last Updated
              </span>
              <span className="text-default-600">
                {intlFormat(
                  new Date(updatedTime),
                  { year: 'numeric', month: 'short', day: 'numeric' },
                  { locale },
                )}
              </span>
            </div>
            {permissions && (
              <div>
                <span className="text-default-400 block text-xs">
                  Permissions
                </span>
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
              </div>
            )}
            {tags && tags.length > 0 && (
              <div>
                <span className="text-default-400 block text-xs">Tags</span>
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
              </div>
            )}
            {patient.sites && patient.sites.length > 0 && (
              <div>
                <span className="text-default-400 block text-xs">Sites</span>
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
              </div>
            )}
          </div>
        </div>
      )}
    </Well>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {PatientDetailsSection}

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
