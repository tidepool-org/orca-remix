import { useRouteLoaderData } from 'react-router';
import { Tab } from '@heroui/react';
import { Database, Smartphone, FileText } from 'lucide-react';

import type { Patient, Prescription } from './types';
import type { DataSet, DataSource, PumpSettings } from '../User/types';
import type { ResourceState } from '~/api.types';
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
import ViewUserAccountLink from '~/components/ui/ViewUserAccountLink';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import { formatShortDate } from '~/utils/dateFormatters';

export type PatientProfileProps = {
  patient: Patient;
  prescriptions?: Prescription[];
  totalPrescriptions?: number;
  prescriptionsLoading?: boolean;
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
  // ResourceState props for error display
  prescriptionsState?: ResourceState<Prescription[]>;
  dataSetsState?: ResourceState<DataSet[]>;
  dataSourcesState?: ResourceState<DataSource[]>;
  pumpSettingsState?: ResourceState<PumpSettings[]>;
};

export default function PatientProfile({
  patient,
  prescriptions = [],
  totalPrescriptions = 0,
  prescriptionsLoading = false,
  clinic,
  dataSets = [],
  totalDataSets = 0,
  dataSources = [],
  totalDataSources = 0,
  pumpSettings = [],
  isPumpSettingsLoading = false,
  // ResourceState props
  prescriptionsState,
  dataSetsState,
  dataSourcesState,
  pumpSettingsState,
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <ProfileHeader
        title={fullName}
        identifiers={patientIdentifiers}
        actionLink={<ViewUserAccountLink userId={id} />}
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
              <CollapsibleGroup>
                <DataSetsTable
                  dataSets={dataSets}
                  totalDataSets={totalDataSets}
                  dataSetsState={dataSetsState}
                  isFirstInGroup
                />
                <DataSourcesTable
                  dataSources={dataSources}
                  totalDataSources={totalDataSources}
                  dataSourcesState={dataSourcesState}
                />
                <DataExportSection userId={id} />
              </CollapsibleGroup>
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
                pumpSettingsState={pumpSettingsState}
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
              <CollapsibleGroup>
                <PrescriptionsTable
                  prescriptions={prescriptions}
                  totalPrescriptions={totalPrescriptions}
                  prescriptionsState={prescriptionsState}
                  isLoading={prescriptionsLoading}
                  context="user"
                  isFirstInGroup
                />
              </CollapsibleGroup>
            </div>
          </Tab>
        </ProfileTabs>
      </div>
    </div>
  );
}
