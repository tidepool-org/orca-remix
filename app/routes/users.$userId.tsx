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
} from '~/components/User/types';
import type { ClinicianClinicMembership } from '~/components/Clinic/types';
import { apiRequest, apiRequests, apiRoutes } from '~/api.server';
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

  const results = await apiRequests([
    apiRoutes.user.get(params.userId as string),
    apiRoutes.user.getMetadata(params.userId as string, 'profile'),
  ]);

  const user: User = (await results?.[0]) as User;
  const profile: Profile = (await results?.[1]) as Profile;

  // Fetch clinics for both clinician and patient users
  let clinics: ClinicianClinicMembership[] = [];
  let totalClinics = 0;

  if (user?.userid) {
    try {
      const clinicsResponse = (await apiRequest(
        profile?.clinic
          ? apiRoutes.clinic.getClinicsForClinician(user.userid, {
              limit: 1000,
              offset: 0,
            })
          : apiRoutes.clinic.getClinicsForPatient(user.userid, {
              limit: 1000,
              offset: 0,
            }),
      )) as
        | ClinicianClinicMembership[]
        | { data: ClinicianClinicMembership[]; meta?: { count: number } };

      // Handle both array response and object with data property
      clinics = Array.isArray(clinicsResponse)
        ? clinicsResponse
        : clinicsResponse?.data || [];
      totalClinics = Array.isArray(clinicsResponse)
        ? clinicsResponse.length
        : clinicsResponse?.meta?.count || clinics.length;
    } catch (error) {
      console.error('Error fetching clinics for user:', error);
      // Continue without clinics data
    }
  }

  // Fetch data sets and data sources for non-clinician users
  let dataSets: DataSet[] = [];
  let totalDataSets = 0;
  let dataSources: DataSource[] = [];
  let totalDataSources = 0;

  if (user?.userid && !profile?.clinic) {
    try {
      const dataSetsResponse = await apiRequest<DataSetsResponse>(
        apiRoutes.data.getDataSets(user.userid),
      );

      // Handle both array response and object with data property
      dataSets = Array.isArray(dataSetsResponse)
        ? dataSetsResponse
        : dataSetsResponse?.data || [];
      totalDataSets = Array.isArray(dataSetsResponse)
        ? dataSetsResponse.length
        : dataSetsResponse?.meta?.count || dataSets.length;
    } catch (error) {
      console.error('Error fetching data sets for user:', error);
      // Continue without data sets
    }

    try {
      const dataSourcesResponse = await apiRequest<DataSourcesResponse>(
        apiRoutes.data.getDataSources(user.userid),
      );

      // Handle both array response and object with data property
      dataSources = Array.isArray(dataSourcesResponse)
        ? dataSourcesResponse
        : dataSourcesResponse?.data || [];
      totalDataSources = Array.isArray(dataSourcesResponse)
        ? dataSourcesResponse.length
        : dataSourcesResponse?.meta?.count || dataSources.length;
    } catch (error) {
      console.error('Error fetching data sources for user:', error);
      // Continue without data sources
    }
  }

  // Fetch data sharing information for non-clinician users
  let trustingAccounts: AccessPermissionsMap = {};
  let trustedAccounts: AccessPermissionsMap = {};
  let sentInvites: ShareInvite[] = [];
  let receivedInvites: ShareInvite[] = [];

  if (user?.userid && !profile?.clinic) {
    // Fetch accounts that share data WITH this user (user can view their data)
    try {
      trustingAccounts = await apiRequest<AccessPermissionsMap>(
        apiRoutes.sharing.getGroupsForUser(user.userid),
      );
    } catch (error) {
      console.error('Error fetching trusting accounts:', error);
    }

    // Fetch accounts that this user shares data WITH (they can view user's data)
    try {
      trustedAccounts = await apiRequest<AccessPermissionsMap>(
        apiRoutes.sharing.getUsersInGroup(user.userid),
      );
    } catch (error) {
      console.error('Error fetching trusted accounts:', error);
    }

    // Fetch pending invites sent by this user
    try {
      const sentResponse = await apiRequest<ShareInvite[]>(
        apiRoutes.invites.getSentInvites(user.userid),
      );
      sentInvites = Array.isArray(sentResponse) ? sentResponse : [];
    } catch (error) {
      console.error('Error fetching sent invites:', error);
    }

    // Fetch pending invites received by this user
    try {
      const receivedResponse = await apiRequest<ShareInvite[]>(
        apiRoutes.invites.getReceivedInvites(user.userid),
      );
      receivedInvites = Array.isArray(receivedResponse) ? receivedResponse : [];
    } catch (error) {
      console.error('Error fetching received invites:', error);
    }
  }

  if (user?.userid) {
    const recentUser: RecentUser = pick(user, ['userid', 'username']);
    if (profile?.fullName) recentUser.fullName = profile?.fullName;
    recentUsers.unshift(recentUser);
    recentlyViewed.set(
      'users',
      uniqBy(recentUsers, 'userid').slice(0, recentUsersMax),
    );

    return Response.json(
      {
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
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
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
  } = useLoaderData<typeof loader>();

  return user && profile ? (
    <UserProfile
      user={user}
      profile={profile}
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
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
