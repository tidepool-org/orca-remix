import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';

import PatientProfile from '~/components/Clinic/PatientProfile';
import type { RecentPatient } from '~/components/Clinic/types';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRoutes } from '~/api.server';
import { patientsSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import { useEffect } from 'react';
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

  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  // We store recently viewed patients in session storage for persistence across browser sessions
  const recentPatients: RecentPatient[] = isArray(
    recentlyViewed.get(`patients-${clinicId}`),
  )
    ? recentlyViewed.get(`patients-${clinicId}`)
    : [];

  // Get the specific patient directly
  const patient = await apiRequest(
    apiRoutes.clinic.getPatient(clinicId, patientId),
  );

  if (patient) {
    const recentPatient: RecentPatient = pick(patient, [
      'id',
      'fullName',
      'email',
    ]);
    recentPatients.unshift(recentPatient);
    recentlyViewed.set(
      `patients-${clinicId}`,
      uniqBy(recentPatients, 'id').slice(0, recentPatientsMax),
    );

    return Response.json(
      { patient, recentPatients: recentlyViewed.get(`patients-${clinicId}`) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return { patient: null, recentPatients };
}

export default function PatientDetails() {
  const { patient } = useLoaderData<typeof loader>();
  const { addRecentPatient } = useRecentItems();

  // Add patient to recent list immediately when component mounts
  useEffect(() => {
    if (patient) {
      const recentPatient: RecentPatient = {
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email,
      };
      addRecentPatient(recentPatient);
    }
  }, [patient, addRecentPatient]);

  return patient ? <PatientProfile patient={patient} /> : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};
