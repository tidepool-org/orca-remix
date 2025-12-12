import { Tab } from '@heroui/react';
import {
  Building2,
  Share2,
  Database,
  Settings,
  FileText,
  Smartphone,
} from 'lucide-react';
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
import ProfileTabs from '~/components/ui/ProfileTabs';
import TabTitle from '~/components/ui/TabTitle';
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

  // For clinician accounts, show tabbed interface with Clinics and Account tabs
  if (clinic) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {UserDetailsSection}

        <div className="w-full">
          <ProfileTabs aria-label="Clinician profile sections">
            {/* Clinics Tab */}
            <Tab
              key="clinics"
              title={
                <TabTitle
                  icon={Building2}
                  label="Clinics"
                  count={totalClinics}
                />
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

            {/* Account Tab */}
            <Tab
              key="account"
              title={<TabTitle icon={Settings} label="Account" />}
            >
              <div className="pt-6">
                <UserActions user={user} />
              </div>
            </Tab>
          </ProfileTabs>
        </div>
      </div>
    );
  }

  // For patient accounts, show tabbed interface
  return (
    <div className="flex flex-col gap-6 w-full">
      {UserDetailsSection}

      <div className="w-full">
        <ProfileTabs aria-label="User profile sections">
          {/* Clinics Tab */}
          <Tab
            key="clinics"
            title={
              <TabTitle icon={Building2} label="Clinics" count={totalClinics} />
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
              <TabTitle
                icon={Share2}
                label="Data Sharing"
                count={dataSharingCount}
              />
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
              <DataExportSection userId={userId} />
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
            title={<TabTitle icon={Settings} label="Account" />}
          >
            <div className="pt-6">
              <UserActions user={user} />
            </div>
          </Tab>
        </ProfileTabs>
      </div>
    </div>
  );
}
