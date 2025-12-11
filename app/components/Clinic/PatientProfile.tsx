import { useRouteLoaderData } from 'react-router';
import { useCallback } from 'react';
import { Tabs, Tab } from '@heroui/react';
import {
  Building2,
  Share2,
  Database,
  Smartphone,
  FileText,
} from 'lucide-react';
import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';

import type { Patient, PatientClinicMembership, Prescription } from './types';
import type {
  DataSet,
  DataSource,
  AccessPermissionsMap,
  ShareInvite,
  PumpSettings,
} from '../User/types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';
import ClinicsTable from './ClinicsTable';
import PrescriptionsTable from './PrescriptionsTable';
import DataSetsTable from '../User/DataSetsTable';
import DataSourcesTable from '../User/DataSourcesTable';
import DataExportSection from '../User/DataExportSection';
import {
  TrustingAccountsTable,
  TrustedAccountsTable,
  SentInvitesTable,
  ReceivedInvitesTable,
} from '../User/DataSharingSection';
import PumpSettingsSection from '../User/PumpSettingsSection';

export type PatientProfileProps = {
  patient: Patient;
  patientClinics?: PatientClinicMembership[];
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
  // Data sharing tab props
  trustingAccounts?: AccessPermissionsMap;
  trustedAccounts?: AccessPermissionsMap;
  sentInvites?: ShareInvite[];
  receivedInvites?: ShareInvite[];
  // Device tab props
  pumpSettings?: PumpSettings[];
  isPumpSettingsLoading?: boolean;
};

export default function PatientProfile({
  patient,
  patientClinics = [],
  prescriptions = [],
  totalPrescriptions = 0,
  prescriptionsLoading = false,
  clinicId,
  clinic,
  dataSets = [],
  totalDataSets = 0,
  dataSources = [],
  totalDataSources = 0,
  trustingAccounts = {},
  trustedAccounts = {},
  sentInvites = [],
  receivedInvites = [],
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

  const patientDetails: Array<{
    label: string;
    value?: string;
    copy?: boolean;
    component?: React.ReactNode;
  }> = [
    {
      label: 'Email',
      value: email,
      copy: true,
    },
    {
      label: 'Patient ID',
      value: id,
      copy: true,
    },
    {
      label: 'MRN',
      value: mrn || '—',
      copy: !!mrn,
    },
    {
      label: 'Birth Date',
      value: birthDate
        ? intlFormat(
            new Date(birthDate),
            { year: 'numeric', month: 'long', day: 'numeric' },
            { locale },
          )
        : '—',
      copy: false,
    },
    {
      label: 'Added',
      value: intlFormat(
        new Date(createdTime),
        { year: 'numeric', month: 'long', day: 'numeric' },
        { locale },
      ),
      copy: false,
    },
    {
      label: 'Last Updated',
      value: intlFormat(
        new Date(updatedTime),
        { year: 'numeric', month: 'long', day: 'numeric' },
        { locale },
      ),
      copy: false,
    },
  ];

  // Add tags to the details array if they exist
  if (tags && tags.length > 0) {
    patientDetails.push({
      label: 'Tags',
      component: (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tagId, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
            >
              {getTagName(tagId)}
            </span>
          ))}
        </div>
      ),
    });
  }

  // Add sites to the details array if they exist
  if (patient.sites && patient.sites.length > 0) {
    patientDetails.push({
      label: 'Sites',
      component: (
        <div className="flex gap-2 flex-wrap">
          {patient.sites.map((site, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs"
            >
              {getSiteName(site.id || site.name || String(site))}
            </span>
          ))}
        </div>
      ),
    });
  }

  // Add permissions to the details array if they exist
  if (permissions) {
    patientDetails.push({
      label: 'Permissions',
      component: (
        <div className="flex gap-2 flex-wrap">
          {permissions.view && (
            <span className="px-2 py-1 bg-success/10 text-success rounded-md text-xs">
              View
            </span>
          )}
          {permissions.upload && (
            <span className="px-2 py-1 bg-warning/10 text-warning rounded-md text-xs">
              Upload
            </span>
          )}
          {permissions.note && (
            <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs">
              Note
            </span>
          )}
        </div>
      ),
    });
  }

  // Calculate counts for tab badges
  const dataSharingCount =
    Object.keys(trustingAccounts).length +
    Object.keys(trustedAccounts).length +
    sentInvites.length +
    receivedInvites.length;

  // Patient details component
  const PatientDetailsSection = (
    <Well>
      <h1 className="text-xl">{fullName}</h1>
      <div className="text-sm">
        {patientDetails.map(({ label, value, copy, component }) => (
          <div
            key={label}
            className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
          >
            <strong>{label}:</strong>
            {component || <p>{value}</p>}
            {copy && <ClipboardButton clipboardText={value} />}
          </div>
        ))}
      </div>
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
          {/* Clinics Tab */}
          <Tab
            key="clinics"
            title={
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Clinics</span>
                {patientClinics.length > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {patientClinics.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6">
              <Well>
                <ClinicsTable
                  clinics={patientClinics}
                  totalClinics={patientClinics.length}
                  showPermissions={true}
                />
              </Well>
            </div>
          </Tab>

          {/* Data Sharing Tab */}
          <Tab
            key="sharing"
            title={
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Data Sharing</span>
                {dataSharingCount > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {dataSharingCount}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6 flex flex-col gap-6">
              <Well>
                <TrustingAccountsTable accounts={trustingAccounts} />
              </Well>
              <Well>
                <TrustedAccountsTable accounts={trustedAccounts} />
              </Well>
              <Well>
                <SentInvitesTable invites={sentInvites} />
              </Well>
              <Well>
                <ReceivedInvitesTable invites={receivedInvites} />
              </Well>
            </div>
          </Tab>

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
              <Well>
                <DataSetsTable
                  dataSets={dataSets}
                  totalDataSets={totalDataSets}
                />
              </Well>
              <Well>
                <DataSourcesTable
                  dataSources={dataSources}
                  totalDataSources={totalDataSources}
                />
              </Well>
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
              <Well>
                <PumpSettingsSection
                  pumpSettings={pumpSettings}
                  isLoading={isPumpSettingsLoading}
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
                  clinicId={clinicId}
                />
              </Well>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
