import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import PatientProfile from '~/components/Clinic/PatientProfile';
import type { RecentPatient } from '~/components/Clinic/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { patientsSession } from '~/patients-sessions.server';
import { useLoaderData } from '@remix-run/react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';

export const meta: MetaFunction = () => {
  return [
    { title: 'Patient Profile | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Patient Profile' },
  ];
};

const recentPatientsMax = 10;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = patientsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed patients in session storage for easy retrieval
  const recentPatients: RecentPatient[] = isArray(recentlyViewed.get('patients'))
    ? recentlyViewed.get('patients')
    : [];

  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  // Get the specific patient directly
  const patient = await apiRequest(
    apiRoutes.clinic.getPatient(clinicId, patientId)
  );

  if (patient) {
    const recentPatient: RecentPatient = pick(patient, ['id', 'fullName', 'email']);
    recentPatients.unshift(recentPatient);
    recentlyViewed.set(
      'patients',
      uniqBy(recentPatients, 'id').slice(0, recentPatientsMax),
    );

    return json(
      { patient },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return { patient: null };
}

export default function PatientDetails() {
  const { patient } = useLoaderData<typeof loader>();

  return (
    <div className="flex">
      {patient && <PatientProfile patient={patient} />}
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};
