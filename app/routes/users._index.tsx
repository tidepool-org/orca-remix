import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import UserLookup from '~/components/User/UserLookup';
import RecentUsers from '~/components/User/RecentUsers';
import type { User, RecentUser } from '~/components/User/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';

export const meta: MetaFunction = () => {
  return [
    { title: 'Users | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Users' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let user: User;
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const { getSession } = usersSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed users in session storage for easy retrieval
  const recentUsers: RecentUser[] = isArray(recentlyViewed.get('users'))
    ? recentlyViewed.get('users')
    : [];

  if (search) {
    user = await apiRequest(apiRoutes.user.get(search));
    const { userid: userId } = user;

    if (userId) {
      return redirect(`/users/${userId}`);
    }
  }

  return { recentUsers };
}

export default function Users() {
  const { recentUsers } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <UserLookup />
      <RecentUsers rows={recentUsers} />
    </div>
  );
}
