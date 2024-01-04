import { LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';

import ClinicLookup from '~/components/Clinic/ClinicLookup';
import RecentClinics from '~/components/Clinic/RecentClinics';
import { RecentClinic } from '~/components/Clinic/types';
import RecentUsers from '~/components/User/RecentUsers';
import UserLookup from '~/components/User/UserLookup';
import { RecentUser } from '~/components/User/types';
import { usersSession, clinicsSession } from '~/sessions.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Home | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Home' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getSession } = usersSession;
  const recentlyViewedUsers = await getSession(request.headers.get('Cookie'));

  // We store recently viewed users in session storage for easy retrieval
  const recentUsers: RecentUser[] = isArray(recentlyViewedUsers.get('users'))
    ? recentlyViewedUsers.get('users')
    : [];

  const { getSession: getClinicsSession } = clinicsSession;
  const recentlyViewedClinics = await getClinicsSession(
    request.headers.get('Cookie'),
  );

  // We store recently viewed clinics in session storage for easy retrieval
  const recentClinics: RecentClinic[] = isArray(
    recentlyViewedClinics.get('clinics'),
  )
    ? recentlyViewedClinics.get('clinics')
    : [];

  return { recentUsers, recentClinics };
}

export default function Index() {
  const { recentClinics, recentUsers } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-x-6 lg:gap-8">
      <div className="flex flex-1 flex-col gap-8 md:gap-x-6 lg:gap-8">
        <UserLookup />
        <RecentUsers rows={recentUsers} />
      </div>
      <div className="flex flex-1 flex-col gap-8 md:gap-x-6 lg:gap-8">
        <ClinicLookup />
        <RecentClinics rows={recentClinics} />
      </div>
    </div>
  );
}
