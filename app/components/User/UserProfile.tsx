import { Tabs, Tab } from '@heroui/react';
import {
  Building2,
  Share2,
  Database,
  Settings,
  FileText,
  Smartphone,
} from 'lucide-react';
import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import ClinicsTable from '../Clinic/ClinicsTable';
import DataSetsTable from './DataSetsTable';
import DataSourcesTable from './DataSourcesTable';
import {
  TrustingAccountsTable,
  TrustedAccountsTable,
  SentInvitesTable,
  ReceivedInvitesTable,
} from './DataSharingSection';
import DataExportSection from './DataExportSection';
import PumpSettingsSection from './PumpSettingsSection';
import PrescriptionsSection from './PrescriptionsSection';
import UserActions from './UserActions';
import type { ClinicianClinicMembership, Prescription } from '../Clinic/types';

import type {
  User,
  Profile,
  DataSet,
  DataSource,
  AccessPermissionsMap,
  ShareInvite,
  PumpSettings,
} from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';

export type UserProfileProps = {
  user: User;
  profile: Profile;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
  dataSets?: DataSet[];
  totalDataSets?: number;
  dataSources?: DataSource[];
  totalDataSources?: number;
  trustingAccounts?: AccessPermissionsMap;
  trustedAccounts?: AccessPermissionsMap;
  sentInvites?: ShareInvite[];
  receivedInvites?: ShareInvite[];
  pumpSettings?: PumpSettings[];
  isPumpSettingsLoading?: boolean;
  prescriptions?: Prescription[];
  totalPrescriptions?: number;
  prescriptionsLoading?: boolean;
};

export default function UserProfile({
  user,
  profile,
  clinics = [],
  totalClinics = 0,
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
  prescriptions = [],
  totalPrescriptions = 0,
  prescriptionsLoading = false,
}: UserProfileProps) {
  const { emailVerified, userid: userId, username, termsAccepted } = user;
  const { fullName, clinic } = profile;
  const { locale } = useLocale();

  // Determine if this is an unclaimed/custodial account
  const isUnclaimedAccount = !emailVerified && !termsAccepted;

  const userDetails = [
    {
      label: 'Email',
      value: username || 'N/A',
      copy: !!username,
    },
    {
      label: 'User ID',
      value: userId,
      copy: true,
    },
    {
      label: 'Account Type',
      value: clinic ? `clinician (${clinic.role})` : 'patient',
    },
    {
      label: 'Account Status',
      value: isUnclaimedAccount
        ? 'Unclaimed (Custodial)'
        : emailVerified
          ? 'Verified'
          : 'Unverified',
    },
    ...(termsAccepted
      ? [
          {
            label: 'Member Since',
            value: intlFormat(
              new Date(termsAccepted),
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
              { locale },
            ),
            copy: false,
          },
        ]
      : []),
  ];

  // Calculate counts for tab badges
  const dataSharingCount =
    Object.keys(trustingAccounts).length +
    Object.keys(trustedAccounts).length +
    sentInvites.length +
    receivedInvites.length;

  // User details component (reused in both layouts)
  const UserDetailsSection = (
    <Well>
      <h1 className="text-xl">{fullName}</h1>
      <div className="text-small">
        {userDetails.map(({ label, value, copy }, i) => (
          <div
            key={i}
            className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
          >
            <strong>{label}:</strong>
            <p>{value}</p>
            {copy && <ClipboardButton clipboardText={value} />}
          </div>
        ))}
      </div>
    </Well>
  );

  // For clinician accounts, show simplified view (no tabs needed)
  if (clinic) {
    return (
      <div className="flex flex-col gap-8 w-full">
        {UserDetailsSection}

        <Well>
          <UserActions user={user} />
        </Well>

        <Well>
          <ClinicsTable
            clinics={clinics}
            totalClinics={totalClinics}
            totalPages={1}
            currentPage={1}
          />
        </Well>
      </div>
    );
  }

  // For patient accounts, show tabbed interface
  return (
    <div className="flex flex-col gap-6 w-full">
      {UserDetailsSection}

      <div className="w-full">
        <Tabs
          aria-label="User profile sections"
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
                {totalClinics > 0 && (
                  <span className="text-xs bg-default-100 px-1.5 py-0.5 rounded-full">
                    {totalClinics}
                  </span>
                )}
              </div>
            }
          >
            <div className="pt-6">
              <Well>
                <ClinicsTable
                  clinics={clinics}
                  totalClinics={totalClinics}
                  totalPages={1}
                  currentPage={1}
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
                <DataExportSection userId={userId} />
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
                <PrescriptionsSection
                  prescriptions={prescriptions}
                  totalPrescriptions={totalPrescriptions}
                  isLoading={prescriptionsLoading}
                />
              </Well>
            </div>
          </Tab>

          {/* Account Tab */}
          <Tab
            key="account"
            title={
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Account</span>
              </div>
            }
          >
            <div className="pt-6">
              <Well>
                <UserActions user={user} />
              </Well>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
