import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from 'react-router';

import UserLookup from '~/components/User/UserLookup';
import RecentUsers from '~/components/User/RecentUsers';
import type { RecentUser } from '~/components/User/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { usersSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import isArray from 'lodash/isArray';
import { UserSchema, UserSearchSchema } from '~/schemas';
import { getErrorMessage, APIError } from '~/utils/errors';

export const meta: MetaFunction = () => {
  return [
    { title: 'Users | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Users' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const { getSession } = usersSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed users in session storage for easy retrieval
  const recentUsers: RecentUser[] = isArray(recentlyViewed.get('users'))
    ? recentlyViewed.get('users')
    : [];

  if (search) {
    try {
      // Validate search input
      const validated = UserSearchSchema.parse({ search });

      // Fetch user with schema validation
      const user = await apiRequest({
        ...apiRoutes.user.get(validated.search),
        schema: UserSchema,
      });

      const { userid: userId } = user;

      if (userId) {
        return redirect(`/users/${userId}`);
      }
    } catch (error) {
      // Determine error type:
      // - APIError = server error (show in toast)
      // - ZodError with 'search' path = input validation (show inline)
      // - Other ZodError = response validation failure (show in toast)
      const isAPIError = error instanceof APIError;
      const isInputValidation =
        !isAPIError &&
        error instanceof Error &&
        error.name === 'ZodError' &&
        error.message.includes('search');

      return {
        recentUsers,
        error: getErrorMessage(error),
        errorType: isInputValidation ? 'validation' : ('api' as const),
      };
    }
  }

  return { recentUsers };
}

export default function Users() {
  const data = useLoaderData<typeof loader>();
  const { recentUsers } = data;

  // Extract error fields with proper type narrowing
  const error = 'error' in data ? data.error : undefined;
  const errorType =
    'errorType' in data ? (data.errorType as 'validation' | 'api') : undefined;

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <UserLookup error={error} errorType={errorType} />
      <RecentUsers rows={recentUsers} />
    </div>
  );
}
