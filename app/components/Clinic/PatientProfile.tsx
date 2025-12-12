import { useRouteLoaderData, Link } from 'react-router';
import { Tab } from '@heroui/react';
import { Database, Smartphone, FileText, ExternalLink } from 'lucide-react';
import Well from '~/partials/Well';

import type { Patient, Prescription } from './types';
import type { DataSet, DataSource, PumpSettings } from '../User/types';
import useLocale from '~/hooks/useLocale';
import useClinicResolvers from '~/hooks/useClinicResolvers';
import PrescriptionsTable from './PrescriptionsTable';
import DataSetsTable from '../User/DataSetsTable';
import ProfileHeader from '~/components/ui/ProfileHeader';
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
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
  const { getTagName, getSiteName } = useClinicResolvers(clinicData);

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
        <ProfileTabs aria-label="Patient profile sections">
          {/* Data Tab */}
          <Tab
            key="data"
            title={
              <TabTitle icon={Database} label="Data" count={totalDataSets} />
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
              <DataExportSection userId={id} />
            </div>
          </Tab>

          {/* Device Tab */}
          <Tab
            key="device"
            title={
              <TabTitle
                icon={Smartphone}
                label="Device"
                count={pumpSettings.length}
              />
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
              <TabTitle
                icon={FileText}
                label="Prescriptions"
                count={totalPrescriptions}
              />
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
        </ProfileTabs>
      </div>
    </div>
  );
}
