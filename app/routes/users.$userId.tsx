import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import UserProfile from '~/components/User/UserProfile';
import type { User, Profile, RecentUser } from '~/components/User/types';
import { apiRequests, apiRoutes } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from '@remix-run/react';
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

  if (user?.userid) {
    const recentUser: RecentUser = pick(user, ['userid', 'username']);
    if (profile?.fullName) recentUser.fullName = profile?.fullName;
    recentUsers.unshift(recentUser);
    recentlyViewed.set(
      'users',
      uniqBy(recentUsers, 'userid').slice(0, recentUsersMax),
    );

    return json(
      { user, profile },
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
  const { user, profile } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      {user && profile && <UserProfile user={user} profile={profile} />}
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
