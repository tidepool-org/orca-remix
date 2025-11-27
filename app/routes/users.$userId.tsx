import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';

import UserProfile from '~/components/User/UserProfile';
import type { User, Profile, RecentUser } from '~/components/User/types';
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

  const user: User = await results?.[0];
  const profile: Profile = await results?.[1];

  // Fetch clinics if user is a clinician
  let clinics: ClinicianClinicMembership[] = [];
  let totalClinics = 0;

  if (user?.userid && profile?.clinic) {
    try {
      const clinicsResponse = await apiRequest(
        apiRoutes.clinic.getClinicsForClinician(user.userid, {
          limit: 1000,
          offset: 0,
        }),
      );

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

  if (user?.userid) {
    const recentUser: RecentUser = pick(user, ['userid', 'username']);
    if (profile?.fullName) recentUser.fullName = profile?.fullName;
    recentUsers.unshift(recentUser);
    recentlyViewed.set(
      'users',
      uniqBy(recentUsers, 'userid').slice(0, recentUsersMax),
    );

    return Response.json(
      { user, profile, clinics, totalClinics },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return { user: null, profile: null };
}

export default function Users() {
  const { user, profile, clinics, totalClinics } =
    useLoaderData<typeof loader>();

  return user && profile ? (
    <UserProfile
      user={user}
      profile={profile}
      clinics={clinics}
      totalClinics={totalClinics}
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
