import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import ClinicLookup from '~/components/Clinic/ClinicLookup';
import RecentClinics from '~/components/Clinic/RecentClinics';
import type { Clinic, RecentClinic } from '~/components/Clinic/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { clinicsSession } from '~/sessions.server';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';

export const meta: MetaFunction = () => {
  return [
    { title: 'Clinics | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Clinics' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let clinic: Clinic;
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const searchBy = url.searchParams.get('clinicSearchBy') || '';
  const { getSession } = clinicsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed users in session storage for easy retrieval
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  if (search) {
    const apiRoute =
      searchBy === 'shareCode'
        ? apiRoutes.clinic.getByShareCode
        : apiRoutes.clinic.get;

    clinic = await apiRequest(apiRoute(search));
    const { id: clinicId } = clinic;

    if (clinicId) {
      return redirect(`/clinics/${clinicId}`);
    }
  }

  return { recentClinics };
}

export default function Clinics() {
  const { recentClinics } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <ClinicLookup />
      <RecentClinics rows={recentClinics} />
    </div>
  );
}
