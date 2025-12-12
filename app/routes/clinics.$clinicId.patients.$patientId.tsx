import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';

import PatientProfile from '~/components/Clinic/PatientProfile';
import type {
  RecentPatient,
  Patient,
  PatientClinicMembership,
  Prescription,
} from '~/components/Clinic/types';
import type {
  DataSet,
  DataSource,
  DataSetsResponse,
  DataSourcesResponse,
  AccessPermissionsMap,
  ShareInvite,
  PumpSettings,
} from '~/components/User/types';
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
  dataSets: DataSet[];
  totalDataSets: number;
  dataSources: DataSource[];
  totalDataSources: number;
  trustingAccounts: AccessPermissionsMap;
  trustedAccounts: AccessPermissionsMap;
  sentInvites: ShareInvite[];
  receivedInvites: ShareInvite[];
  pumpSettings: PumpSettings[];
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

  // Get the specific patient, their clinics, prescriptions, and data in parallel
  const [
    patient,
    patientClinicsResponse,
    prescriptionsResponse,
    dataSetsResponse,
    dataSourcesResponse,
    trustingAccountsResponse,
    trustedAccountsResponse,
    sentInvitesResponse,
    receivedInvitesResponse,
    pumpSettingsResponse,
  ] = await Promise.all([
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
    // Data sets
    apiRequest<DataSetsResponse>({
      ...apiRoutes.data.getDataSets(patientId),
    }).catch((err) => {
      console.error('Error fetching data sets:', err);
      return [];
    }),
    // Data sources
    apiRequest<DataSourcesResponse>({
      ...apiRoutes.data.getDataSources(patientId),
    }).catch((err) => {
      console.error('Error fetching data sources:', err);
      return [];
    }),
    // Sharing - accounts that share with this user (trusting)
    apiRequest<AccessPermissionsMap>({
      ...apiRoutes.sharing.getGroupsForUser(patientId),
    }).catch((err) => {
      console.error('Error fetching trusting accounts:', err);
      return {};
    }),
    // Sharing - users who have access to this user's data (trusted)
    apiRequest<AccessPermissionsMap>({
      ...apiRoutes.sharing.getUsersInGroup(patientId),
    }).catch((err) => {
      console.error('Error fetching trusted accounts:', err);
      return {};
    }),
    // Sent invites
    apiRequest<ShareInvite[]>({
      ...apiRoutes.invites.getSentInvites(patientId),
    }).catch((err) => {
      console.error('Error fetching sent invites:', err);
      return [];
    }),
    // Received invites
    apiRequest<ShareInvite[]>({
      ...apiRoutes.invites.getReceivedInvites(patientId),
    }).catch((err) => {
      console.error('Error fetching received invites:', err);
      return [];
    }),
    // Pump settings
    apiRequest<PumpSettings[]>({
      ...apiRoutes.data.getData(patientId, {
        type: 'pumpSettings',
        latest: true,
      }),
    }).catch((err) => {
      console.error('Error fetching pump settings:', err);
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

    // Process data sets response
    let dataSets: DataSet[] = [];
    let totalDataSets = 0;
    if (Array.isArray(dataSetsResponse)) {
      dataSets = dataSetsResponse;
      totalDataSets = dataSetsResponse.length;
    } else if (
      dataSetsResponse &&
      typeof dataSetsResponse === 'object' &&
      'data' in dataSetsResponse
    ) {
      dataSets = dataSetsResponse.data;
      totalDataSets = dataSetsResponse.meta?.count || dataSets.length;
    }

    // Process data sources response
    let dataSources: DataSource[] = [];
    let totalDataSources = 0;
    if (Array.isArray(dataSourcesResponse)) {
      dataSources = dataSourcesResponse;
      totalDataSources = dataSourcesResponse.length;
    } else if (
      dataSourcesResponse &&
      typeof dataSourcesResponse === 'object' &&
      'data' in dataSourcesResponse
    ) {
      dataSources = dataSourcesResponse.data;
      totalDataSources = dataSourcesResponse.meta?.count || dataSources.length;
    }

    // Ensure sharing responses are objects
    const trustingAccounts =
      trustingAccountsResponse &&
      typeof trustingAccountsResponse === 'object' &&
      !Array.isArray(trustingAccountsResponse)
        ? (trustingAccountsResponse as AccessPermissionsMap)
        : {};

    const trustedAccounts =
      trustedAccountsResponse &&
      typeof trustedAccountsResponse === 'object' &&
      !Array.isArray(trustedAccountsResponse)
        ? (trustedAccountsResponse as AccessPermissionsMap)
        : {};

    // Ensure invites are arrays
    const sentInvites = Array.isArray(sentInvitesResponse)
      ? sentInvitesResponse
      : [];
    const receivedInvites = Array.isArray(receivedInvitesResponse)
      ? receivedInvitesResponse
      : [];

    // Ensure pump settings is an array
    const pumpSettings = Array.isArray(pumpSettingsResponse)
      ? pumpSettingsResponse
      : [];

    return Response.json(
      {
        patient,
        patientClinics: clinicsData,
        prescriptions,
        recentPatients: recentlyViewed.get(`patients-${clinicId}`),
        dataSets,
        totalDataSets,
        dataSources,
        totalDataSources,
        trustingAccounts,
        trustedAccounts,
        sentInvites,
        receivedInvites,
        pumpSettings,
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
    dataSets: [],
    totalDataSets: 0,
    dataSources: [],
    totalDataSources: 0,
    trustingAccounts: {},
    trustedAccounts: {},
    sentInvites: [],
    receivedInvites: [],
    pumpSettings: [],
  };
}

export default function PatientDetails() {
  const {
    patient,
    prescriptions,
    dataSets,
    totalDataSets,
    dataSources,
    totalDataSources,
    pumpSettings,
  } = useLoaderData<PatientLoaderData>();
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
      prescriptions={prescriptions}
      dataSets={dataSets}
      totalDataSets={totalDataSets}
      dataSources={dataSources}
      totalDataSources={totalDataSources}
      pumpSettings={pumpSettings}
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};
