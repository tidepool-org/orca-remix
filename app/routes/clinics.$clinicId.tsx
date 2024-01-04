import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import ClinicProfile from '~/components/Clinic/ClinicProfile';
import type { Clinic, RecentClinic } from '~/components/Clinic/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { clinicsSession } from '~/sessions.server';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';

export const meta: MetaFunction = () => {
  return [
    { title: 'Clinic Profile | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Clinic Profile' },
  ];
};

const recentClinicsMax = 10;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = clinicsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewd users in session storage for easy retrieval
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  const clinic: Clinic = await apiRequest(
    apiRoutes.clinic.get(params.clinicId as string),
  );

  if (clinic) {
    recentClinics.unshift(pick(clinic, ['id', 'shareCode']));
    recentlyViewed.set(
      'clinics',
      uniqBy(recentClinics, 'id').slice(0, recentClinicsMax),
    );

    return json(
      { clinic },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return { clinic: null };
}

export default function Clinics() {
  const { clinic } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      {clinic && <ClinicProfile clinic={clinic} />}
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'Clinic Profile' },
};
