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
import ProfileHeader from '~/components/ui/ProfileHeader';
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
import { formatShortDate } from '~/utils/dateFormatters';

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

  // Calculate counts for tab badges (excluding current user's own entries)
  const trustingAccountsCount = Object.keys(trustingAccounts).filter(
    (id) => id !== userId,
  ).length;
  const trustedAccountsCount = Object.keys(trustedAccounts).filter(
    (id) => id !== userId,
  ).length;
  const dataSharingCount =
    trustingAccountsCount +
    trustedAccountsCount +
    sentInvites.length +
    receivedInvites.length;

  // User profile header configuration
  const userIdentifiers = [
    ...(username ? [{ value: username }] : []),
    { label: 'ID:', value: userId, monospace: true },
  ];

  const userDetailFields = [
    {
      label: 'Account Type',
      value: clinic ? `Clinician (${clinic.role})` : 'Patient',
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
            value: formatShortDate(termsAccepted, locale),
          },
        ]
      : []),
  ];

  const UserDetailsSection = (
    <ProfileHeader
      title={fullName || username || 'Unknown User'}
      identifiers={userIdentifiers}
      detailFields={userDetailFields}
    />
  );

  // For clinician accounts, show simplified view (no tabs needed)
  if (clinic) {
    return (
      <div className="flex flex-col gap-8 w-full">
        {UserDetailsSection}

        <Well>
          <UserActions user={user} />
        </Well>

        <ClinicsTable
          clinics={clinics}
          totalClinics={totalClinics}
          totalPages={1}
          currentPage={1}
        />
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
              <ClinicsTable
                clinics={clinics}
                totalClinics={totalClinics}
                totalPages={1}
                currentPage={1}
              />
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
              <TrustingAccountsTable
                accounts={trustingAccounts}
                currentUserId={userId}
              />
              <TrustedAccountsTable
                accounts={trustedAccounts}
                currentUserId={userId}
              />
              <SentInvitesTable invites={sentInvites} />
              <ReceivedInvitesTable invites={receivedInvites} />
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
              <DataSetsTable
                dataSets={dataSets}
                totalDataSets={totalDataSets}
              />
              <DataSourcesTable
                dataSources={dataSources}
                totalDataSources={totalDataSources}
              />
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
              <PrescriptionsSection
                prescriptions={prescriptions}
                totalPrescriptions={totalPrescriptions}
                isLoading={prescriptionsLoading}
              />
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
