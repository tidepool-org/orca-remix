import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  redirect,
} from 'react-router';

import UserProfile from '~/components/User/UserProfile';
import type {
  User,
  Profile,
  RecentUser,
  DataSet,
  DataSource,
  DataSetsResponse,
  DataSourcesResponse,
  AccessPermissionsMap,
  ShareInvite,
  PumpSettings,
} from '~/components/User/types';
import type {
  ClinicianClinicMembership,
  Prescription,
} from '~/components/Clinic/types';
import type { ResourceState } from '~/api.types';
import { apiRequest, apiRoutes, apiRequestSafe } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';
import { APIError } from '~/utils/errors';

export const meta: MetaFunction = () => {
  return [
    { title: 'User Profile | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA User Profile' },
  ];
};

const recentUsersMax = 10;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = usersSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed users in session storage for easy retrieval
  const recentUsers: RecentUser[] = isArray(recentlyViewed.get('users'))
    ? recentlyViewed.get('users')
    : [];

  // Fetch user data (required)
  const user: User = (await apiRequest(
    apiRoutes.user.get(params.userId as string),
  )) as User;

  // Fetch profile data (optional - may not exist for all users)
  const profileState = await apiRequestSafe<Profile>(
    apiRoutes.user.getMetadata(params.userId as string, 'profile'),
  );

  // Treat 404 as empty profile (expected when user has no profile metadata)
  let profile: Profile;
  if (profileState.status === 'error' && profileState.error.code === 404) {
    profile = {} as Profile;
  } else if (profileState.status === 'success') {
    profile = profileState.data;
  } else {
    // For other errors, use empty profile but log the error
    console.error('[getMetadata] Error fetching profile:', profileState.error);
    profile = {} as Profile;
  }

  // Initialize ResourceState containers for non-critical data
  type ClinicsResponse =
    | ClinicianClinicMembership[]
    | { data: ClinicianClinicMembership[]; meta?: { count: number } };

  let clinicsState: ResourceState<ClinicianClinicMembership[]> = {
    status: 'success',
    data: [],
  };
  let dataSetsState: ResourceState<DataSet[]> = { status: 'success', data: [] };
  let dataSourcesState: ResourceState<DataSource[]> = {
    status: 'success',
    data: [],
  };
  let pumpSettingsState: ResourceState<PumpSettings[]> = {
    status: 'success',
    data: [],
  };
  let prescriptionsState: ResourceState<Prescription[]> = {
    status: 'success',
    data: [],
  };
  let trustingAccountsState: ResourceState<AccessPermissionsMap> = {
    status: 'success',
    data: {},
  };
  let trustedAccountsState: ResourceState<AccessPermissionsMap> = {
    status: 'success',
    data: {},
  };
  let sentInvitesState: ResourceState<ShareInvite[]> = {
    status: 'success',
    data: [],
  };
  let receivedInvitesState: ResourceState<ShareInvite[]> = {
    status: 'success',
    data: [],
  };

  if (user?.userid) {
    // Fetch clinics for both clinician and patient users
    const clinicsRawState = await apiRequestSafe<ClinicsResponse>(
      profile?.clinic
        ? apiRoutes.clinic.getClinicsForClinician(user.userid, {
            limit: 1000,
            offset: 0,
          })
        : apiRoutes.clinic.getClinicsForPatient(user.userid, {
            limit: 1000,
            offset: 0,
          }),
    );

    // Normalize the response to always be an array
    if (clinicsRawState.status === 'success') {
      const response = clinicsRawState.data;
      clinicsState = {
        status: 'success',
        data: Array.isArray(response) ? response : response?.data || [],
      };
    } else {
      clinicsState = clinicsRawState as ResourceState<
        ClinicianClinicMembership[]
      >;
    }

    // Fetch additional data for non-clinician users
    if (!profile?.clinic) {
      // Fetch data sets
      const dataSetsRawState = await apiRequestSafe<DataSetsResponse>(
        apiRoutes.data.getDataSets(user.userid),
      );
      if (dataSetsRawState.status === 'success') {
        const response = dataSetsRawState.data;
        dataSetsState = {
          status: 'success',
          data: Array.isArray(response) ? response : response?.data || [],
        };
      } else {
        dataSetsState = dataSetsRawState as ResourceState<DataSet[]>;
      }

      // Fetch data sources
      const dataSourcesRawState = await apiRequestSafe<DataSourcesResponse>(
        apiRoutes.data.getDataSources(user.userid),
      );
      if (dataSourcesRawState.status === 'success') {
        const response = dataSourcesRawState.data;
        dataSourcesState = {
          status: 'success',
          data: Array.isArray(response) ? response : response?.data || [],
        };
      } else {
        dataSourcesState = dataSourcesRawState as ResourceState<DataSource[]>;
      }

      // Fetch pump settings (latest 10)
      const pumpSettingsRawState = await apiRequestSafe<PumpSettings[]>(
        apiRoutes.data.getData(user.userid, {
          type: 'pumpSettings',
          latest: true,
        }),
      );
      if (pumpSettingsRawState.status === 'success') {
        pumpSettingsState = {
          status: 'success',
          data: Array.isArray(pumpSettingsRawState.data)
            ? pumpSettingsRawState.data.slice(0, 10)
            : [],
        };
      } else {
        pumpSettingsState = pumpSettingsRawState;
      }

      // Fetch prescriptions for this patient
      const prescriptionsRawState = await apiRequestSafe<Prescription[]>(
        apiRoutes.prescription.getPatientPrescriptions(user.userid),
      );

      // Treat 404 as empty array (expected when no prescriptions exist)
      if (
        prescriptionsRawState.status === 'error' &&
        prescriptionsRawState.error.code === 404
      ) {
        prescriptionsState = { status: 'success', data: [] };
      } else if (prescriptionsRawState.status === 'success') {
        prescriptionsState = {
          status: 'success',
          data: Array.isArray(prescriptionsRawState.data)
            ? prescriptionsRawState.data
            : [],
        };
      } else {
        prescriptionsState = prescriptionsRawState;
      }

      // Fetch data sharing information
      trustingAccountsState = await apiRequestSafe<AccessPermissionsMap>(
        apiRoutes.sharing.getGroupsForUser(user.userid),
      );

      trustedAccountsState = await apiRequestSafe<AccessPermissionsMap>(
        apiRoutes.sharing.getUsersInGroup(user.userid),
      );

      // Fetch pending invites - 404 is expected when none exist
      const sentInvitesRawState = await apiRequestSafe<ShareInvite[]>(
        apiRoutes.invites.getSentInvites(user.userid),
      );
      // Treat 404 as empty array (expected when no invites)
      if (
        sentInvitesRawState.status === 'error' &&
        sentInvitesRawState.error.code === 404
      ) {
        sentInvitesState = { status: 'success', data: [] };
      } else if (sentInvitesRawState.status === 'success') {
        sentInvitesState = {
          status: 'success',
          data: Array.isArray(sentInvitesRawState.data)
            ? sentInvitesRawState.data
            : [],
        };
      } else {
        sentInvitesState = sentInvitesRawState;
      }

      const receivedInvitesRawState = await apiRequestSafe<ShareInvite[]>(
        apiRoutes.invites.getReceivedInvites(user.userid),
      );
      // Treat 404 as empty array (expected when no invites)
      if (
        receivedInvitesRawState.status === 'error' &&
        receivedInvitesRawState.error.code === 404
      ) {
        receivedInvitesState = { status: 'success', data: [] };
      } else if (receivedInvitesRawState.status === 'success') {
        receivedInvitesState = {
          status: 'success',
          data: Array.isArray(receivedInvitesRawState.data)
            ? receivedInvitesRawState.data
            : [],
        };
      } else {
        receivedInvitesState = receivedInvitesRawState;
      }
    }
  }

  // Extract data for backward compatibility
  const clinics = clinicsState.status === 'success' ? clinicsState.data : [];
  const totalClinics = clinics.length;
  const dataSets = dataSetsState.status === 'success' ? dataSetsState.data : [];
  const totalDataSets = dataSets.length;
  const dataSources =
    dataSourcesState.status === 'success' ? dataSourcesState.data : [];
  const totalDataSources = dataSources.length;
  const pumpSettings =
    pumpSettingsState.status === 'success' ? pumpSettingsState.data : [];
  const prescriptions =
    prescriptionsState.status === 'success' ? prescriptionsState.data : [];
  const trustingAccounts =
    trustingAccountsState.status === 'success'
      ? trustingAccountsState.data
      : {};
  const trustedAccounts =
    trustedAccountsState.status === 'success' ? trustedAccountsState.data : {};
  const sentInvites =
    sentInvitesState.status === 'success' ? sentInvitesState.data : [];
  const receivedInvites =
    receivedInvitesState.status === 'success' ? receivedInvitesState.data : [];

  if (user?.userid) {
    const recentUser: RecentUser = pick(user, ['userid', 'username']);
    if (profile?.fullName) recentUser.fullName = profile?.fullName;
    recentUsers.unshift(recentUser);
    const updatedRecentUsers = uniqBy(recentUsers, 'userid').slice(
      0,
      recentUsersMax,
    );
    recentlyViewed.set('users', updatedRecentUsers);

    return Response.json(
      {
        user,
        profile,
        // Data with backward compatibility
        clinics,
        totalClinics,
        dataSets,
        totalDataSets,
        dataSources,
        totalDataSources,
        trustingAccounts,
        trustedAccounts,
        sentInvites,
        receivedInvites,
        pumpSettings,
        prescriptions,
        // ResourceState for error display
        clinicsState,
        dataSetsState,
        dataSourcesState,
        pumpSettingsState,
        prescriptionsState,
        trustingAccountsState,
        trustedAccountsState,
        sentInvitesState,
        receivedInvitesState,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return {
    user: null,
    profile: null,
    clinics: [],
    totalClinics: 0,
    dataSets: [],
    totalDataSets: 0,
    dataSources: [],
    totalDataSources: 0,
    trustingAccounts: {},
    trustedAccounts: {},
    sentInvites: [],
    receivedInvites: [],
    pumpSettings: [],
    prescriptions: [],
    // Default ResourceState values
    clinicsState: { status: 'success', data: [] } as ResourceState<
      ClinicianClinicMembership[]
    >,
    dataSetsState: { status: 'success', data: [] } as ResourceState<DataSet[]>,
    dataSourcesState: { status: 'success', data: [] } as ResourceState<
      DataSource[]
    >,
    pumpSettingsState: { status: 'success', data: [] } as ResourceState<
      PumpSettings[]
    >,
    prescriptionsState: { status: 'success', data: [] } as ResourceState<
      Prescription[]
    >,
    trustingAccountsState: {
      status: 'success',
      data: {},
    } as ResourceState<AccessPermissionsMap>,
    trustedAccountsState: {
      status: 'success',
      data: {},
    } as ResourceState<AccessPermissionsMap>,
    sentInvitesState: { status: 'success', data: [] } as ResourceState<
      ShareInvite[]
    >,
    receivedInvitesState: { status: 'success', data: [] } as ResourceState<
      ShareInvite[]
    >,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const userId = params.userId as string;

  // First, fetch the user to get their email for certain operations
  let user: User | null = null;
  try {
    user = (await apiRequest(apiRoutes.user.get(userId))) as User;
  } catch {
    return Response.json(
      { success: false, error: 'Failed to fetch user information' },
      { status: 400 },
    );
  }

  if (!user) {
    return Response.json(
      { success: false, error: 'User not found' },
      { status: 404 },
    );
  }

  try {
    switch (intent) {
      case 'verify-email': {
        // Step 1: Get the signup key for the user
        const signupKeyResponse = (await apiRequest(
          apiRoutes.user.getSignupKey(userId),
        )) as { key?: string };

        if (!signupKeyResponse?.key) {
          return Response.json(
            {
              success: false,
              error: 'Could not retrieve signup key for user',
            },
            { status: 400 },
          );
        }

        // Step 2: Use the key to confirm the signup
        await apiRequest(
          apiRoutes.user.confirmSignup(userId, signupKeyResponse.key),
        );

        return Response.json({
          success: true,
          action: 'verify-email',
          message: 'User email verified successfully',
        });
      }

      case 'password-reset': {
        if (!user.username) {
          return Response.json(
            {
              success: false,
              error:
                'Cannot send password reset to unclaimed account without email',
            },
            { status: 400 },
          );
        }
        await apiRequest(apiRoutes.user.sendPasswordReset(user.username));
        return Response.json({
          success: true,
          action: 'password-reset',
          message: 'Password reset email sent successfully',
        });
      }

      case 'send-confirmation': {
        await apiRequest(apiRoutes.user.sendConfirmation(userId));
        return Response.json({
          success: true,
          action: 'send-confirmation',
          message: 'Confirmation email sent successfully',
        });
      }

      case 'resend-confirmation': {
        if (!user.username) {
          return Response.json(
            {
              success: false,
              error:
                'Cannot resend confirmation to unclaimed account without email',
            },
            { status: 400 },
          );
        }
        await apiRequest(apiRoutes.user.resendConfirmation(user.username));
        return Response.json({
          success: true,
          action: 'resend-confirmation',
          message: 'Confirmation email resent successfully',
        });
      }

      case 'delete-data': {
        await apiRequest(apiRoutes.user.deleteData(userId));
        return Response.json({
          success: true,
          action: 'delete-data',
          message: 'User data deleted successfully',
        });
      }

      case 'delete-account': {
        await apiRequest(apiRoutes.user.delete(userId));
        // Redirect to users index after account deletion
        return redirect('/users');
      }

      case 'delete-dataset': {
        const dataSetId = formData.get('dataSetId') as string;
        if (!dataSetId) {
          return Response.json(
            { success: false, error: 'Dataset ID is required' },
            { status: 400 },
          );
        }
        await apiRequest(apiRoutes.data.deleteDataSet(dataSetId));
        return Response.json({
          success: true,
          action: 'delete-dataset',
          message: 'Dataset deleted successfully',
        });
      }

      case 'delete-dataset-data': {
        const dataSetId = formData.get('dataSetId') as string;
        if (!dataSetId) {
          return Response.json(
            { success: false, error: 'Dataset ID is required' },
            { status: 400 },
          );
        }
        await apiRequest(apiRoutes.data.deleteDataFromDataSet(dataSetId));
        return Response.json({
          success: true,
          action: 'delete-dataset-data',
          message: 'Data deleted from dataset successfully',
        });
      }

      case 'disconnect-data-source': {
        const dataSourceId = formData.get('dataSourceId') as string;
        if (!dataSourceId) {
          return Response.json(
            { success: false, error: 'Data source ID is required' },
            { status: 400 },
          );
        }
        await apiRequest(apiRoutes.data.deleteDataSource(dataSourceId));
        return Response.json({
          success: true,
          action: 'disconnect-data-source',
          message: 'Data source disconnected successfully',
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${intent}` },
          { status: 400 },
        );
    }
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : 'An unexpected error occurred';

    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export default function Users() {
  const {
    user,
    profile,
    clinics,
    totalClinics,
    dataSets,
    totalDataSets,
    dataSources,
    totalDataSources,
    trustingAccounts,
    trustedAccounts,
    sentInvites,
    receivedInvites,
    pumpSettings,
    prescriptions,
    clinicsState,
    dataSetsState,
    dataSourcesState,
    pumpSettingsState,
    prescriptionsState,
    trustingAccountsState,
    trustedAccountsState,
    sentInvitesState,
    receivedInvitesState,
  } = useLoaderData<typeof loader>();

  // Render profile if user exists (profile may be empty object for users without profile metadata)
  return user ? (
    <UserProfile
      user={user}
      profile={profile || {}}
      clinics={clinics}
      totalClinics={totalClinics}
      dataSets={dataSets}
      totalDataSets={totalDataSets}
      dataSources={dataSources}
      totalDataSources={totalDataSources}
      trustingAccounts={trustingAccounts}
      trustedAccounts={trustedAccounts}
      sentInvites={sentInvites}
      receivedInvites={receivedInvites}
      pumpSettings={pumpSettings}
      prescriptions={prescriptions}
      clinicsState={clinicsState}
      dataSetsState={dataSetsState}
      dataSourcesState={dataSourcesState}
      pumpSettingsState={pumpSettingsState}
      prescriptionsState={prescriptionsState}
      trustingAccountsState={trustingAccountsState}
      trustedAccountsState={trustedAccountsState}
      sentInvitesState={sentInvitesState}
      receivedInvitesState={receivedInvitesState}
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
