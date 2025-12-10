import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';

import PatientProfile from '~/components/Clinic/PatientProfile';
import type {
  RecentPatient,
  Patient,
  PatientClinicMembership,
  Prescription,
} from '~/components/Clinic/types';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRoutes } from '~/api.server';
import { patientsSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import { useEffect } from 'react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';
import { PatientSchema } from '~/schemas';

type PatientLoaderData = {
  patient: Patient | null;
  patientClinics: PatientClinicMembership[];
  prescriptions: Prescription[];
  recentPatients: RecentPatient[];
};

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

  // Get the specific patient, their clinics, and prescriptions in parallel
  const [patient, patientClinicsResponse, prescriptionsResponse] =
    await Promise.all([
      apiRequest({
        ...apiRoutes.clinic.getPatient(clinicId, patientId),
        schema: PatientSchema,
      }),
      apiRequest({
        ...apiRoutes.clinic.getClinicsForPatient(patientId),
      }).catch((err) => {
        console.error('Error fetching patient clinics:', err);
        return null;
      }),
      apiRequest({
        ...apiRoutes.prescription.getClinicPrescriptions(clinicId, {
          patientUserId: patientId,
        }),
      }).catch((err) => {
        console.error('Error fetching patient prescriptions:', err);
        return [];
      }),
    ]);

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

    // Handle both array response and object with data property
    let clinicsData: unknown[] = [];
    if (Array.isArray(patientClinicsResponse)) {
      clinicsData = patientClinicsResponse;
    } else if (
      patientClinicsResponse &&
      typeof patientClinicsResponse === 'object' &&
      'data' in patientClinicsResponse &&
      Array.isArray(patientClinicsResponse.data)
    ) {
      clinicsData = patientClinicsResponse.data;
    }

    // Handle prescriptions response
    const prescriptions: Prescription[] = Array.isArray(prescriptionsResponse)
      ? prescriptionsResponse
      : [];

    return Response.json(
      {
        patient,
        patientClinics: clinicsData,
        prescriptions,
        recentPatients: recentlyViewed.get(`patients-${clinicId}`),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  return {
    patient: null,
    patientClinics: [],
    prescriptions: [],
    recentPatients,
  };
}

export default function PatientDetails() {
  const { patient, patientClinics, prescriptions } =
    useLoaderData<PatientLoaderData>();
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

  return patient ? (
    <PatientProfile
      patient={patient}
      patientClinics={patientClinics}
      prescriptions={prescriptions}
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};
