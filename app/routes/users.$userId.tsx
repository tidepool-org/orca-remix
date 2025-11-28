import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';

import UserProfile from '~/components/User/UserProfile';
import type {
  User,
  Profile,
  RecentUser,
  DataSet,
  DataSource,
  DataSetsResponse,
  DataSourcesResponse,
} from '~/components/User/types';
import type { ClinicianClinicMembership } from '~/components/Clinic/types';
import { apiRequest, apiRequests, apiRoutes } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';

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
  };
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
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
