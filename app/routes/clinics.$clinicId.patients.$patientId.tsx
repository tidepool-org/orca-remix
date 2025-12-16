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
import type { ResourceState } from '~/api.types';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRequestSafe, apiRoutes } from '~/api.server';
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
  // ResourceState for error display
  patientClinicsState: ResourceState<PatientClinicMembership[]>;
  prescriptionsState: ResourceState<Prescription[]>;
  dataSetsState: ResourceState<DataSet[]>;
  dataSourcesState: ResourceState<DataSource[]>;
  trustingAccountsState: ResourceState<AccessPermissionsMap>;
  trustedAccountsState: ResourceState<AccessPermissionsMap>;
  sentInvitesState: ResourceState<ShareInvite[]>;
  receivedInvitesState: ResourceState<ShareInvite[]>;
  pumpSettingsState: ResourceState<PumpSettings[]>;
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

  // Get the specific patient (critical) - this must succeed
  const patient = await apiRequest({
    ...apiRoutes.clinic.getPatient(clinicId, patientId),
    schema: PatientSchema,
  });

  // Type for clinics response that can be array or object with data
  type ClinicsResponse =
    | PatientClinicMembership[]
    | { data: PatientClinicMembership[]; meta?: { count: number } };

  // Fetch non-critical data in parallel using apiRequestSafe
  const [
    patientClinicsRawState,
    prescriptionsRawState,
    dataSetsRawState,
    dataSourcesRawState,
    trustingAccountsRawState,
    trustedAccountsRawState,
    sentInvitesRawState,
    receivedInvitesRawState,
    pumpSettingsRawState,
  ] = await Promise.all([
    apiRequestSafe<ClinicsResponse>(
      apiRoutes.clinic.getClinicsForPatient(patientId),
    ),
    apiRequestSafe<Prescription[]>(
      apiRoutes.prescription.getPatientPrescriptions(patientId),
    ),
    apiRequestSafe<DataSetsResponse>(apiRoutes.data.getDataSets(patientId)),
    apiRequestSafe<DataSourcesResponse>(
      apiRoutes.data.getDataSources(patientId),
    ),
    apiRequestSafe<AccessPermissionsMap>(
      apiRoutes.sharing.getGroupsForUser(patientId),
    ),
    apiRequestSafe<AccessPermissionsMap>(
      apiRoutes.sharing.getUsersInGroup(patientId),
    ),
    apiRequestSafe<ShareInvite[]>(apiRoutes.invites.getSentInvites(patientId)),
    apiRequestSafe<ShareInvite[]>(
      apiRoutes.invites.getReceivedInvites(patientId),
    ),
    apiRequestSafe<PumpSettings[]>(
      apiRoutes.data.getData(patientId, {
        type: 'pumpSettings',
        latest: true,
      }),
    ),
  ]);

  // Normalize patient clinics response
  let patientClinicsState: ResourceState<PatientClinicMembership[]>;
  if (patientClinicsRawState.status === 'success') {
    const response = patientClinicsRawState.data;
    patientClinicsState = {
      status: 'success',
      data: Array.isArray(response) ? response : response?.data || [],
    };
  } else {
    patientClinicsState = patientClinicsRawState as ResourceState<
      PatientClinicMembership[]
    >;
  }

  // Normalize prescriptions response
  let prescriptionsState: ResourceState<Prescription[]>;
  if (prescriptionsRawState.status === 'success') {
    prescriptionsState = {
      status: 'success',
      data: Array.isArray(prescriptionsRawState.data)
        ? prescriptionsRawState.data
        : [],
    };
  } else {
    prescriptionsState = prescriptionsRawState;
  }

  // Normalize data sets response
  let dataSetsState: ResourceState<DataSet[]>;
  if (dataSetsRawState.status === 'success') {
    const response = dataSetsRawState.data;
    dataSetsState = {
      status: 'success',
      data: Array.isArray(response) ? response : response?.data || [],
    };
  } else {
    dataSetsState = dataSetsRawState as ResourceState<DataSet[]>;
  }

  // Normalize data sources response
  let dataSourcesState: ResourceState<DataSource[]>;
  if (dataSourcesRawState.status === 'success') {
    const response = dataSourcesRawState.data;
    dataSourcesState = {
      status: 'success',
      data: Array.isArray(response) ? response : response?.data || [],
    };
  } else {
    dataSourcesState = dataSourcesRawState as ResourceState<DataSource[]>;
  }

  // Normalize sharing accounts (ensure they're objects, not arrays)
  let trustingAccountsState: ResourceState<AccessPermissionsMap>;
  if (trustingAccountsRawState.status === 'success') {
    const response = trustingAccountsRawState.data;
    trustingAccountsState = {
      status: 'success',
      data:
        response && typeof response === 'object' && !Array.isArray(response)
          ? response
          : {},
    };
  } else {
    trustingAccountsState = trustingAccountsRawState;
  }

  let trustedAccountsState: ResourceState<AccessPermissionsMap>;
  if (trustedAccountsRawState.status === 'success') {
    const response = trustedAccountsRawState.data;
    trustedAccountsState = {
      status: 'success',
      data:
        response && typeof response === 'object' && !Array.isArray(response)
          ? response
          : {},
    };
  } else {
    trustedAccountsState = trustedAccountsRawState;
  }

  // Normalize invites - 404 is expected when none exist
  let sentInvitesState: ResourceState<ShareInvite[]>;
  if (
    sentInvitesRawState.status === 'error' &&
    sentInvitesRawState.error.code === 404
  ) {
    sentInvitesState = { status: 'success', data: [] };
  } else if (sentInvitesRawState.status === 'success') {
    sentInvitesState = {
      status: 'success',
      data: Array.isArray(sentInvitesRawState.data)
        ? sentInvitesRawState.data
        : [],
    };
  } else {
    sentInvitesState = sentInvitesRawState;
  }

  let receivedInvitesState: ResourceState<ShareInvite[]>;
  if (
    receivedInvitesRawState.status === 'error' &&
    receivedInvitesRawState.error.code === 404
  ) {
    receivedInvitesState = { status: 'success', data: [] };
  } else if (receivedInvitesRawState.status === 'success') {
    receivedInvitesState = {
      status: 'success',
      data: Array.isArray(receivedInvitesRawState.data)
        ? receivedInvitesRawState.data
        : [],
    };
  } else {
    receivedInvitesState = receivedInvitesRawState;
  }

  // Normalize pump settings
  let pumpSettingsState: ResourceState<PumpSettings[]>;
  if (pumpSettingsRawState.status === 'success') {
    pumpSettingsState = {
      status: 'success',
      data: Array.isArray(pumpSettingsRawState.data)
        ? pumpSettingsRawState.data.slice(0, 10)
        : [],
    };
  } else {
    pumpSettingsState = pumpSettingsRawState;
  }

  // Extract data for backward compatibility
  const patientClinics =
    patientClinicsState.status === 'success' ? patientClinicsState.data : [];
  const prescriptions =
    prescriptionsState.status === 'success' ? prescriptionsState.data : [];
  const dataSets = dataSetsState.status === 'success' ? dataSetsState.data : [];
  const totalDataSets = dataSets.length;
  const dataSources =
    dataSourcesState.status === 'success' ? dataSourcesState.data : [];
  const totalDataSources = dataSources.length;
  const trustingAccounts =
    trustingAccountsState.status === 'success'
      ? trustingAccountsState.data
      : {};
  const trustedAccounts =
    trustedAccountsState.status === 'success' ? trustedAccountsState.data : {};
  const sentInvites =
    sentInvitesState.status === 'success' ? sentInvitesState.data : [];
  const receivedInvites =
    receivedInvitesState.status === 'success' ? receivedInvitesState.data : [];
  const pumpSettings =
    pumpSettingsState.status === 'success' ? pumpSettingsState.data : [];

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
      {
        patient,
        patientClinics,
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
        // ResourceState for error display
        patientClinicsState,
        prescriptionsState,
        dataSetsState,
        dataSourcesState,
        trustingAccountsState,
        trustedAccountsState,
        sentInvitesState,
        receivedInvitesState,
        pumpSettingsState,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'Set-Cookie': await commitSession(recentlyViewed),
        },
      },
    );
  }

  // Default ResourceState values for when patient is not found
  const defaultSuccessState = <T,>(data: T): ResourceState<T> => ({
    status: 'success',
    data,
  });

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
    // Default ResourceState values
    patientClinicsState: defaultSuccessState<PatientClinicMembership[]>([]),
    prescriptionsState: defaultSuccessState<Prescription[]>([]),
    dataSetsState: defaultSuccessState<DataSet[]>([]),
    dataSourcesState: defaultSuccessState<DataSource[]>([]),
    trustingAccountsState: defaultSuccessState<AccessPermissionsMap>({}),
    trustedAccountsState: defaultSuccessState<AccessPermissionsMap>({}),
    sentInvitesState: defaultSuccessState<ShareInvite[]>([]),
    receivedInvitesState: defaultSuccessState<ShareInvite[]>([]),
    pumpSettingsState: defaultSuccessState<PumpSettings[]>([]),
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
    prescriptionsState,
    dataSetsState,
    dataSourcesState,
    pumpSettingsState,
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
      prescriptionsState={prescriptionsState}
      dataSets={dataSets}
      dataSetsState={dataSetsState}
      totalDataSets={totalDataSets}
      dataSources={dataSources}
      dataSourcesState={dataSourcesState}
      totalDataSources={totalDataSources}
      pumpSettings={pumpSettings}
      pumpSettingsState={pumpSettingsState}
    />
  ) : null;
}

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};
