import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import UserProfile from '~/components/User/UserProfile';
import type { User, RecentUser } from '~/components/User/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';
import { BreadcrumbItem } from '@nextui-org/react';

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

  // We store recently viewd users in session storage for easy retrieval
  const recentUsers: RecentUser[] = isArray(recentlyViewed.get('users'))
    ? recentlyViewed.get('users')
    : [];

  const user: User = await apiRequest(
    apiRoutes.user.get(params.userId as string),
  );

  if (user) {
    recentUsers.unshift(pick(user, ['userid', 'username']));
    recentlyViewed.set(
      'users',
      uniqBy(recentUsers, 'userid').slice(0, recentUsersMax),
    );

    return json(
      { user },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return { user: null };
}

export default function Users() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      {user && <UserProfile user={user} />}
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'User Profile' },
};
