import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunctionArgs,
} from 'react-router';

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
  DataSourcesResponse,
  AccessPermissionsMap,
  ShareInvite,
  PumpSettings,
  ConnectionRequest,
} from '~/components/User/types';
import type { ResourceState } from '~/api.types';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRequestSafe, apiRoutes } from '~/api.server';
import { patientsCookie, patientsSession } from '~/sessions.server';
import { useLoaderData, useSearchParams, useSubmit } from 'react-router';
import { useCallback, useEffect } from 'react';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';
import { PatientSchema } from '~/schemas';
import { usePersistedTab } from '~/hooks/usePersistedTab';
import { APIError } from '~/utils/errors';
import { backfillPumpSettingsDeviceInfo } from '~/utils/deviceNames';
import { fetchBackfillUploads } from '~/utils/deviceNames.server';
import { loadUploadsPage } from '~/utils/uploadsPaging.server';
import {
  knownUploadCount,
  parseUploadsPage,
  uploadsPageSize,
} from '~/utils/uploadsPaging';
import {
  clinicScopedPrefixes,
  commitClinicScopedSession,
  readClinicScopedList,
  writeClinicScopedList,
} from '~/utils/recentEntities.server';

type PatientLoaderData = {
  patient: Patient | null;
  patientClinics: PatientClinicMembership[];
  prescriptions: Prescription[];
  recentPatients: RecentPatient[];
  dataSets: DataSet[];
  totalDataSets: number;
  uploadsPage: number;
  hasMoreDataSets: boolean;
  dataSources: DataSource[];
  totalDataSources: number;
  connectionRequests: ConnectionRequest[];
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

export const handle = {
  breadcrumb: { href: '#', label: 'Patient Profile' },
};

/**
 * Skip loader revalidation when only the 'tab' search param changed.
 */
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (currentUrl.pathname === nextUrl.pathname) {
    const currentParams = new URLSearchParams(currentUrl.search);
    const nextParams = new URLSearchParams(nextUrl.search);
    const currentTab = currentParams.get('tab');
    const nextTab = nextParams.get('tab');
    currentParams.delete('tab');
    nextParams.delete('tab');

    if (
      currentTab !== nextTab &&
      currentParams.toString() === nextParams.toString()
    ) {
      return false;
    }
  }

  return defaultShouldRevalidate;
}

const recentPatientsMax = 10;

/** Flatten the nested connectionRequests object into a flat array,
 *  keeping only the most recent request per provider. */
function flattenConnectionRequests(
  connectionRequests?: Patient['connectionRequests'],
): ConnectionRequest[] {
  if (!connectionRequests) return [];
  const result: ConnectionRequest[] = [];
  for (const requests of Object.values(connectionRequests)) {
    if (Array.isArray(requests) && requests.length > 0) {
      const sorted = [...requests].sort(
        (a, b) =>
          new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
      );
      result.push(sorted[0]);
    }
  }
  return result;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession } = patientsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));
  const url = new URL(request.url);
  const uploadsPage = parseUploadsPage(url.searchParams);

  const clinicId = params.clinicId as string;

  const patientId = params.patientId as string;

  // We store recently viewed patients in session storage for persistence across browser sessions
  const recentPatients = readClinicScopedList<RecentPatient>(
    recentlyViewed,
    clinicScopedPrefixes.patients,
    clinicId,
  );

  // Get the specific patient (critical) - this must succeed
  let patient: Patient;
  try {
    patient = await apiRequest({
      ...apiRoutes.clinic.getPatient(clinicId, patientId),
      schema: PatientSchema,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    if (error instanceof APIError && error.status === 404) {
      throw new Response('Patient not found', { status: 404 });
    }
    console.error('Error loading patient:', error);
    throw new Response('Failed to load patient', { status: 500 });
  }

  // Type for clinics response that can be array or object with data
  type ClinicsResponse =
    | PatientClinicMembership[]
    | { data: PatientClinicMembership[]; meta?: { count: number } };

  // Fetch non-critical data in parallel using apiRequestSafe
  const [
    patientClinicsRawState,
    prescriptionsRawState,
    uploadsPageResult,
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
    loadUploadsPage(patientId, uploadsPage),
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

  // Normalize prescriptions response - treat 404 as empty array
  let prescriptionsState: ResourceState<Prescription[]>;
  if (
    prescriptionsRawState.status === 'error' &&
    prescriptionsRawState.error.code === 404
  ) {
    prescriptionsState = { status: 'success', data: [] };
  } else if (prescriptionsRawState.status === 'success') {
    prescriptionsState = {
      status: 'success',
      data: Array.isArray(prescriptionsRawState.data)
        ? prescriptionsRawState.data
        : [],
    };
  } else {
    prescriptionsState = prescriptionsRawState;
  }

  const { dataSetsState, hasMore: hasMoreDataSets } = uploadsPageResult;

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
        ? pumpSettingsRawState.data
        : [],
    };
  } else {
    pumpSettingsState = pumpSettingsRawState;
  }

  // Some pump-settings records omit manufacturer/model/serial; backfill from
  // each one's own upload so the device-info row renders fully.
  if (pumpSettingsState.status === 'success') {
    const uploads = await fetchBackfillUploads(
      patientId,
      pumpSettingsState.data,
    );
    if (uploads.length > 0) {
      pumpSettingsState = {
        ...pumpSettingsState,
        data: backfillPumpSettingsDeviceInfo(pumpSettingsState.data, uploads),
      };
    }
  }

  // Extract data for backward compatibility
  const patientClinics =
    patientClinicsState.status === 'success' ? patientClinicsState.data : [];
  const prescriptions =
    prescriptionsState.status === 'success' ? prescriptionsState.data : [];
  const dataSets = dataSetsState.status === 'success' ? dataSetsState.data : [];
  const totalDataSets = knownUploadCount(
    uploadsPage,
    uploadsPageSize,
    dataSets.length,
  );
  const dataSources =
    dataSourcesState.status === 'success' ? dataSourcesState.data : [];
  const totalDataSources = dataSources.length;
  const connectionRequests = flattenConnectionRequests(
    patient?.connectionRequests,
  );
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
    const updatedRecentPatients = uniqBy(recentPatients, 'id').slice(
      0,
      recentPatientsMax,
    );
    writeClinicScopedList(
      recentlyViewed,
      clinicScopedPrefixes.patients,
      clinicId,
      updatedRecentPatients,
    );

    return Response.json(
      {
        patient,
        patientClinics,
        prescriptions,
        recentPatients: updatedRecentPatients,
        dataSets,
        totalDataSets,
        uploadsPage,
        hasMoreDataSets,
        dataSources,
        totalDataSources,
        connectionRequests,
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
          'Cache-Control': 'private, max-age=60',
          'Set-Cookie': await commitClinicScopedSession(
            recentlyViewed,
            clinicScopedPrefixes.patients,
            clinicId,
            request.headers.get('Cookie'),
            patientsCookie,
          ),
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
    uploadsPage: 1,
    hasMoreDataSets: false,
    dataSources: [],
    totalDataSources: 0,
    connectionRequests: [],
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

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  try {
    switch (intent) {
      case 'send-connect-request': {
        const providerName = formData.get('providerName') as string;
        const isResend = formData.get('isResend') === 'true';

        if (!providerName) {
          return Response.json(
            { success: false, error: 'Provider name is required' },
            { status: 400 },
          );
        }

        // Step 1: For new invites, ensure a pending data source entry exists
        // The backend requires a dataSources entry with the provider before
        // a connection request can be created.
        if (!isResend) {
          const patient = await apiRequest({
            ...apiRoutes.clinic.getPatient(clinicId, patientId),
            schema: PatientSchema,
          });
          const hasProviderDataSource = patient.dataSources?.some(
            (ds) => ds.providerName === providerName,
          );

          if (!hasProviderDataSource) {
            const updatedDataSources = [
              ...(patient.dataSources || []),
              { providerName, state: 'pending' },
            ];

            // Omit read-only fields that the backend rejects on update
            const patientUpdate = omit(patient, [
              'id',
              'clinicId',
              'userId',
              'createdTime',
              'updatedTime',
              'permissions',
              'summary',
              'reviews',
              'connectionRequests',
              'isMigrated',
              'legacyClinicianIds',
              'invitedBy',
              'lastUploadReminderTime',
              'ehrSubscriptions',
            ]);

            await apiRequest({
              ...apiRoutes.clinic.updatePatient(clinicId, patientId),
              body: {
                ...patientUpdate,
                dataSources: updatedDataSources,
              } as Record<string, unknown>,
            });
          }
        }

        // Step 2: Send the connection request
        await apiRequest(
          apiRoutes.clinic.sendConnectRequest(
            clinicId,
            patientId,
            providerName,
          ),
        );
        return Response.json({
          success: true,
          action: 'send-connect-request',
          message: `Connection invite sent for ${providerName}`,
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${intent}` },
          { status: 400 },
        );
    }
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : 'An unexpected error occurred';

    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export default function Patient() {
  const {
    patient,
    prescriptions,
    dataSets,
    totalDataSets,
    uploadsPage,
    hasMoreDataSets,
    dataSources,
    totalDataSources,
    connectionRequests,
    pumpSettings,
    prescriptionsState,
    dataSetsState,
    dataSourcesState,
    pumpSettingsState,
  } = useLoaderData<PatientLoaderData>();
  const { addRecentPatient } = useRecentItems();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const handleUploadsPageChange = useCallback(
    (page: number) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('uploadsPage', page.toString());
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  // Tab persistence with localStorage + URL sync
  const { currentTab, handleTabChange } = usePersistedTab(
    'patient',
    patient?.id,
    'data',
    // The uploads page belongs to the Data tab; it should not outlive it.
    { resetParamKeys: ['uploadsPage'] },
  );

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
      uploadsPage={uploadsPage}
      uploadsPageSize={uploadsPageSize}
      hasMoreDataSets={hasMoreDataSets}
      onUploadsPageChange={handleUploadsPageChange}
      dataSources={dataSources}
      dataSourcesState={dataSourcesState}
      totalDataSources={totalDataSources}
      connectionRequests={connectionRequests}
      pumpSettings={pumpSettings}
      pumpSettingsState={pumpSettingsState}
      selectedTab={currentTab || undefined}
      onTabChange={handleTabChange}
    />
  ) : null;
}
