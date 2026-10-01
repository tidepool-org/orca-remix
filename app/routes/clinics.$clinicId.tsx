import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunctionArgs,
  redirect,
  data,
  useLoaderData,
  useSubmit,
  useNavigation,
  Outlet,
  useLocation,
  useActionData,
} from 'react-router';

import ClinicProfile from '~/components/Clinic/ClinicProfile';
import type { ClinicSettingsPayload } from '~/components/Clinic/ClinicProfile';
import type {
  Clinic,
  RecentClinic,
  Patient,
  PatientInvite,
  RecentPatient,
  Clinician,
  RecentClinician,
  RecentPrescription,
  ClinicianInvite,
  Prescription,
} from '~/components/Clinic/types';
import { RecentItemsProvider } from '~/components/Clinic/RecentItemsContext';
import { apiRoutes, apiRequest, apiRequestSafe } from '~/api.server';
import type { ResourceState } from '~/api.types';
import {
  clinicsSession,
  patientsSession,
  cliniciansSession,
  prescriptionsSession,
} from '~/sessions.server';
import { useCallback, useEffect } from 'react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';
import {
  UpdateTierSchema,
  MrnSettingsSchema,
  PatientCountSettingsSchema,
  UpdateTimezoneSchema,
} from '~/schemas';
import {
  errorResponse,
  APIError,
  ValidationError,
  getErrorMessage,
} from '~/utils/errors';
import {
  clinicScopedPrefixes,
  readClinicScopedList,
  recentClinicsMax,
} from '~/utils/recentEntities.server';
import { useToast } from '~/contexts/ToastContext';
import { usePersistedTab } from '~/hooks/usePersistedTab';
import { useSearchParamUpdate } from '~/hooks/useSearchParamUpdate';
import { filterClinicians, sortClinicians } from '~/utils/clinicians';
import { filterPrescriptions, sortPrescriptions } from '~/utils/prescriptions';

export const meta: MetaFunction = () => {
  return [
    { title: 'Clinic Profile | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Clinic Profile' },
  ];
};

export const handle = {
  breadcrumb: { href: '/clinics/$clinicId', label: 'Clinic Profile' },
};

/**
 * Skip loader revalidation when only the 'tab' search param changed.
 * The loader doesn't use the tab param, so re-fetching is unnecessary.
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

const defaultPageSize = 10;
const cliniciansFetchLimit = 1000;

// The clinicians endpoint returns clinicians and pending invites together
type ClinicianRecord = {
  id?: string;
  inviteId?: string;
  email?: string;
  name?: string;
  roles?: string[];
  createdTime?: string;
  updatedTime?: string;
};

const dataOrEmpty = <T,>(state: ResourceState<T>, empty: T) =>
  state.status === 'success' ? state.data : empty;

// Carry only the rows the page shows, so a full list is not sent twice
const withPageData = <T,>(
  state: ResourceState<unknown>,
  data: T,
): ResourceState<T> =>
  state.status === 'success' ? { status: 'success', data } : state;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = clinicsSession;
  const { getSession: getRecentPatientsSession } = patientsSession;
  const { getSession: getRecentCliniciansSession } = cliniciansSession;
  const { getSession: getRecentPrescriptionsSession } = prescriptionsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));
  const recentPatientsData = await getRecentPatientsSession(
    request.headers.get('Cookie'),
  );
  const recentCliniciansData = await getRecentCliniciansSession(
    request.headers.get('Cookie'),
  );
  const recentPrescriptionsData = await getRecentPrescriptionsSession(
    request.headers.get('Cookie'),
  );
  const url = new URL(request.url);

  // Parse pagination and sorting parameters for patients
  const patientsPage = Math.max(
    1,
    parseInt(url.searchParams.get('patientsPage') || '1'),
  );
  const limit = Math.max(
    1,
    Math.min(
      100,
      parseInt(url.searchParams.get('limit') || defaultPageSize.toString()),
    ),
  );
  const offset = (patientsPage - 1) * limit;
  const patientsSearch = url.searchParams.get('patientsSearch') || undefined;
  const sort = url.searchParams.get('sort') || undefined;

  // Parse pagination parameters for clinicians (frontend pagination only)
  const cliniciansPage = Math.max(
    1,
    parseInt(url.searchParams.get('cliniciansPage') || '1'),
  );
  const cliniciansLimit = Math.max(
    1,
    Math.min(
      100,
      parseInt(
        url.searchParams.get('cliniciansLimit') || defaultPageSize.toString(),
      ),
    ),
  );
  const cliniciansSearch =
    url.searchParams.get('cliniciansSearch') || undefined;
  const cliniciansSort = url.searchParams.get('cliniciansSort') || undefined;

  // Parse pagination parameters for prescriptions (frontend pagination only)
  const prescriptionsPage = Math.max(
    1,
    parseInt(url.searchParams.get('prescriptionsPage') || '1'),
  );
  const prescriptionsLimit = Math.max(
    1,
    Math.min(
      100,
      parseInt(
        url.searchParams.get('prescriptionsLimit') ||
          defaultPageSize.toString(),
      ),
    ),
  );
  const prescriptionsSearch =
    url.searchParams.get('prescriptionsSearch') || undefined;
  const prescriptionsSort =
    url.searchParams.get('prescriptionsSort') || undefined;

  const clinicId = params.clinicId as string;

  // We store recently viewed clinics, patients, and clinicians in session storage
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  const recentPatients = readClinicScopedList<RecentPatient>(
    recentPatientsData,
    clinicScopedPrefixes.patients,
    clinicId,
  );

  const recentClinicians = readClinicScopedList<RecentClinician>(
    recentCliniciansData,
    clinicScopedPrefixes.clinicians,
    clinicId,
  );

  const recentPrescriptions = readClinicScopedList<RecentPrescription>(
    recentPrescriptionsData,
    clinicScopedPrefixes.prescriptions,
    clinicId,
  );

  try {
    // Only the clinic itself is required: each list loads on its own, so a
    // failure shows inline in that list's table instead of breaking the page.
    // There is no endpoint to list a clinic's clinician invites
    // (GET /v1/clinics/{clinicId}/invites/clinicians doesn't exist); they
    // arrive mixed into the clinicians list.
    const [
      clinic,
      patientsResult,
      patientInvitesResult,
      cliniciansResult,
      prescriptionsResult,
      mrnSettings,
      patientCountSettings,
    ] = await Promise.all([
      apiRequest<Clinic>(apiRoutes.clinic.get(clinicId)),
      apiRequestSafe<{ data: Patient[]; meta?: { count: number } }>(
        apiRoutes.clinic.getPatients(clinicId, {
          limit,
          offset,
          search: patientsSearch,
          sort,
        }),
      ),
      apiRequestSafe<PatientInvite[]>(
        apiRoutes.clinic.getPatientInvites(clinicId),
      ),
      apiRequestSafe<ClinicianRecord[]>(
        apiRoutes.clinic.getClinicians(clinicId, {
          limit: cliniciansFetchLimit,
        }),
      ),
      apiRequestSafe<Prescription[]>(
        apiRoutes.prescription.getClinicPrescriptions(clinicId),
      ),
      apiRequest(apiRoutes.clinic.getMrnSettings(clinicId))
        .then((data) => data as { required: boolean; unique: boolean })
        .catch((err) => {
          console.error('Error fetching MRN settings:', err);
          return null;
        }),
      apiRequest(apiRoutes.clinic.getPatientCountSettings(clinicId))
        .then(
          (data) =>
            data as {
              // `patientCount` is the legacy name for `plan`; read as a
              // fallback for clinics/backends that predate the rename.
              hardLimit?: { plan?: number; patientCount?: number };
              softLimit?: { plan?: number; patientCount?: number };
            },
        )
        .catch((err) => {
          console.error('Error fetching patient count settings:', err);
          return null;
        }),
    ]);

    // Parse response data
    // The API structure may vary based on clinic configuration
    const patientsResponse = dataOrEmpty(patientsResult, { data: [] });
    const patients: Patient[] = patientsResponse.data || [];
    const totalPatients = patientsResponse.meta?.count || 0;
    const totalPages = Math.ceil(totalPatients / limit);

    const patientInvites = dataOrEmpty(patientInvitesResult, []);
    const totalInvites = patientInvites.length;

    // The clinicians list holds both clinicians and pending invites:
    // clinicians have 'id' (no 'inviteId'), invites have 'inviteId' (no 'id')
    const allRecords = dataOrEmpty(cliniciansResult, []);

    // Separate actual clinicians from pending invites
    const allClinicians = allRecords.filter(
      (record) => record.id && !record.inviteId,
    );

    // Extract pending clinician invites and map to ClinicianInvite type
    const clinicianInvites: ClinicianInvite[] = allRecords
      .filter((record) => record.inviteId)
      .map((invite) => ({
        inviteId: invite.inviteId!,
        email: invite.email || '',
        roles: invite.roles || [],
        clinicId: clinicId,
        createdTime: invite.createdTime || '',
        status: 'pending' as const,
      }));

    const totalClinicianInvites = clinicianInvites.length;

    const sortedClinicians = sortClinicians(
      filterClinicians(allClinicians as Clinician[], cliniciansSearch),
      cliniciansSort,
    );
    const totalClinicians = sortedClinicians.length;
    const cliniciansTotalPages = Math.ceil(totalClinicians / cliniciansLimit);

    // Slice clinicians for current page (frontend pagination)
    const cliniciansStart = (cliniciansPage - 1) * cliniciansLimit;
    const clinicians = sortedClinicians.slice(
      cliniciansStart,
      cliniciansStart + cliniciansLimit,
    );

    const sortedPrescriptions = sortPrescriptions(
      filterPrescriptions(
        dataOrEmpty(prescriptionsResult, []),
        prescriptionsSearch,
      ),
      prescriptionsSort,
    );
    const totalPrescriptions = sortedPrescriptions.length;
    const prescriptionsTotalPages = Math.ceil(
      totalPrescriptions / prescriptionsLimit,
    );

    // Slice prescriptions for current page (frontend pagination)
    const prescriptionsStart = (prescriptionsPage - 1) * prescriptionsLimit;
    const prescriptions = sortedPrescriptions.slice(
      prescriptionsStart,
      prescriptionsStart + prescriptionsLimit,
    );
    if (clinic?.id) {
      recentClinics.unshift(pick(clinic, ['id', 'shareCode', 'name']));
      recentlyViewed.set(
        'clinics',
        uniqBy(recentClinics, 'id').slice(0, recentClinicsMax),
      );

      // The clinic-scoped caches are left to the child loaders that own them
      // (see commitClinicScopedSession): only those loaders create their keys,
      // so pruning there covers every key and keeps one writer per cookie per
      // request.
      return data(
        {
          clinic,
          patients,
          patientsState: withPageData(patientsResult, patients),
          patientInvites,
          patientInvitesState: withPageData(
            patientInvitesResult,
            patientInvites,
          ),
          clinicians,
          cliniciansState: withPageData(cliniciansResult, clinicians),
          clinicianInvites,
          clinicianInvitesState: withPageData(
            cliniciansResult,
            clinicianInvites,
          ),
          prescriptions,
          prescriptionsState: withPageData(prescriptionsResult, prescriptions),
          mrnSettings,
          patientCountSettings,
          recentPatients,
          recentClinicians,
          recentPrescriptions,
          pagination: {
            currentPage: patientsPage,
            totalPages,
            totalPatients,
            pageSize: limit,
          },
          cliniciansPagination: {
            currentPage: cliniciansPage,
            totalPages: cliniciansTotalPages,
            totalClinicians,
            pageSize: cliniciansLimit,
          },
          prescriptionsPagination: {
            currentPage: prescriptionsPage,
            totalPages: prescriptionsTotalPages,
            totalPrescriptions,
            pageSize: prescriptionsLimit,
          },
          invitesPagination: {
            totalInvites,
            totalClinicianInvites,
          },
          sorting: {
            sort,
            patientsSearch,
            cliniciansSearch,
            cliniciansSort,
            prescriptionsSearch,
            prescriptionsSort,
          },
        },
        {
          headers: {
            'Cache-Control': 'private, no-cache',
            'Set-Cookie': await commitSession(recentlyViewed),
          },
        },
      );
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof APIError) {
      if (error.status === 404) {
        throw new Response('Clinic not found', { status: 404 });
      }
      // For other API errors, throw with the original status
      throw new Response(error.message, { status: error.status || 500 });
    }
    // Re-throw unknown errors to be handled by error boundary
    throw error;
  }

  // If we get here without a clinic, it wasn't found
  throw new Response('Clinic not found', { status: 404 });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('actionType');
  const clinicId = params.clinicId as string;

  if (actionType === 'updateClinicSettings') {
    // Combined save: the client sends only the fields it detected as dirty
    // (an absent field means unchanged), so each present field maps to exactly
    // one existing endpoint and unchanged settings trigger no API call.
    // Results are aggregated per field so a partial failure is reported rather
    // than reported as blanket success.
    const results: { field: string; ok: boolean; error?: string }[] = [];

    const record = async (field: string, run: () => Promise<void>) => {
      try {
        await run();
        results.push({ field, ok: true });
      } catch (error) {
        results.push({ field, ok: false, error: getErrorMessage(error) });
      }
    };

    if (formData.has('tier')) {
      await record('tier', async () => {
        const validated = UpdateTierSchema.parse({
          tier: formData.get('tier'),
        });
        await apiRequest({
          ...apiRoutes.clinic.updateTier(clinicId),
          body: { tier: validated.tier },
        });
      });
    }

    if (formData.has('timezone')) {
      await record('timezone', async () => {
        const validated = UpdateTimezoneSchema.parse({
          timezone: formData.get('timezone'),
        });
        // The clinic update endpoint requires name + preferredBgUnits, so fetch
        // the current clinic first to supply them alongside the new timezone.
        const clinic = (await apiRequest(apiRoutes.clinic.get(clinicId))) as {
          name: string;
          preferredBgUnits: string;
        };
        await apiRequest({
          ...apiRoutes.clinic.update(clinicId),
          body: {
            name: clinic.name,
            preferredBgUnits: clinic.preferredBgUnits,
            timezone: validated.timezone,
          },
        });
      });
    }

    if (formData.has('mrnRequired') || formData.has('mrnUnique')) {
      await record('MRN settings', async () => {
        // The update endpoint replaces the whole MRN settings object, so a
        // partial submit would silently clear the omitted field. Require both
        // fields and accept only the literal strings 'true'/'false' — an absent
        // or malformed value must be rejected, not coerced to false.
        const toBool = (value: FormDataEntryValue | null, name: string) => {
          if (value === 'true') return true;
          if (value === 'false') return false;
          throw new ValidationError(`Missing or invalid ${name}`);
        };
        const validated = MrnSettingsSchema.parse({
          required: toBool(formData.get('mrnRequired'), 'mrnRequired'),
          unique: toBool(formData.get('mrnUnique'), 'mrnUnique'),
        });
        await apiRequest({
          ...apiRoutes.clinic.updateMrnSettings(clinicId),
          body: validated,
        });
      });
    }

    if (formData.has('hardLimitPlan')) {
      await record('patient limit', async () => {
        // Never apply a limit on the back of a tier change that failed: the
        // clinic would keep its old (possibly ineligible) tier while gaining a
        // limit that only tier0100 clinics may have.
        const tierResult = results.find((result) => result.field === 'tier');
        if (tierResult && !tierResult.ok) {
          throw new ValidationError('Skipped because the tier update failed');
        }

        const raw = formData.get('hardLimitPlan');
        const value = typeof raw === 'string' ? raw.trim() : '';
        const isRemoval = value === '';

        // A blank value intentionally removes the limit; any non-blank value
        // must be an exact non-negative integer. Reject decimals, exponent
        // notation, signs and other malformed input rather than silently
        // truncating them (parseInt('2.5') === 2) or dropping them to a removal.
        if (!isRemoval && !/^\d+$/.test(value)) {
          throw new ValidationError(
            'Patient limit must be a whole number of 0 or more',
          );
        }

        // Omit hardLimit entirely to remove the limit — the API requires `plan`
        // if `hardLimit` is present, so an empty value must produce settings {}.
        const settings: { hardLimit?: { plan: number } } = {};
        if (!isRemoval) {
          settings.hardLimit = { plan: parseInt(value, 10) };
        }
        PatientCountSettingsSchema.parse(settings);
        await apiRequest({
          ...apiRoutes.clinic.updatePatientCountSettings(clinicId),
          body: settings,
        });
      });
    }

    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      const failedFields = failed.map((result) => result.field).join(', ');
      return errorResponse(`Failed to update: ${failedFields}`, 500);
    }

    return Response.json({
      success: true,
      message: 'Clinic settings updated successfully',
    });
  }

  if (actionType === 'deleteClinic') {
    try {
      // Make API request to delete the clinic
      await apiRequest({
        ...apiRoutes.clinic.delete(clinicId),
      });

      // Redirect to clinics list after successful deletion
      return redirect('/clinics');
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'revokeClinicianInvite') {
    const inviteId = formData.get('inviteId') as string;

    if (!inviteId) {
      return errorResponse('Invite ID is required', 400);
    }

    try {
      await apiRequest({
        ...apiRoutes.clinic.deleteClinicianInvite(clinicId, inviteId),
      });

      return Response.json({
        success: true,
        message: 'Clinician invitation revoked successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'removeClinician') {
    const clinicianId = formData.get('clinicianId') as string;

    if (!clinicianId) {
      return errorResponse('Clinician ID is required', 400);
    }

    try {
      await apiRequest({
        ...apiRoutes.clinic.deleteClinician(clinicId, clinicianId),
      });

      return Response.json({
        success: true,
        message: 'Clinician removed from clinic successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'revokePatientInvite') {
    const inviteId = formData.get('inviteId') as string;

    if (!inviteId) {
      return errorResponse('Invite ID is required', 400);
    }

    try {
      await apiRequest({
        ...apiRoutes.clinic.deletePatientInvite(clinicId, inviteId),
      });

      return Response.json({
        success: true,
        message: 'Patient invitation revoked successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  return errorResponse('Invalid action', 400);
}

export default function Clinic() {
  const {
    clinic,
    patients,
    patientsState,
    patientInvites,
    patientInvitesState,
    clinicians,
    cliniciansState,
    clinicianInvites,
    clinicianInvitesState,
    prescriptions,
    prescriptionsState,
    mrnSettings,
    patientCountSettings,
    recentPatients,
    recentClinicians,
    recentPrescriptions,
    pagination,
    cliniciansPagination,
    prescriptionsPagination,
    invitesPagination,
    sorting,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<{
    success?: boolean;
    error?: string;
    message?: string;
  }>();
  const submit = useSubmit();
  const updateSearchParams = useSearchParamUpdate();
  const navigation = useNavigation();
  const location = useLocation();
  const { showToast } = useToast();

  // Check if we're on a nested route (like patient, clinician, or prescription details)
  const isNestedRoute =
    location.pathname.includes('/patients/') ||
    location.pathname.includes('/clinicians/') ||
    location.pathname.includes('/prescriptions/');

  // Tab persistence with localStorage + URL sync
  // Disabled on nested routes so the child route's search params don't overwrite the clinic's persisted state
  const { currentTab, handleTabChange } = usePersistedTab(
    'clinic',
    clinic.id,
    'patients',
    {
      paramKeys: [
        'patientsSearch',
        'patientsPage',
        'limit',
        'sort',
        'cliniciansSearch',
        'cliniciansPage',
        'cliniciansLimit',
        'cliniciansSort',
        'prescriptionsSearch',
        'prescriptionsPage',
        'prescriptionsLimit',
        'prescriptionsSort',
      ],
      enabled: !isNestedRoute,
    },
  );

  // Show toast on action result
  useEffect(() => {
    if (actionData) {
      if ('error' in actionData && actionData.error) {
        showToast(actionData.error, 'error');
      } else if ('success' in actionData && actionData.success) {
        showToast(
          actionData.message || 'Clinic tier updated successfully',
          'success',
        );
      }
    }
  }, [actionData, showToast]);

  const handlePageChange = useCallback(
    (page: number) => updateSearchParams({ patientsPage: page }),
    [updateSearchParams],
  );

  const handleCliniciansPageChange = useCallback(
    (page: number) => updateSearchParams({ cliniciansPage: page }),
    [updateSearchParams],
  );

  const handlePrescriptionsPageChange = useCallback(
    (page: number) => updateSearchParams({ prescriptionsPage: page }),
    [updateSearchParams],
  );

  // Sorting and searching re-page the list, so the page index goes back to 1.
  const handleSort = useCallback(
    (sort: string) => updateSearchParams({ sort, patientsPage: 1 }),
    [updateSearchParams],
  );

  const handleSearch = useCallback(
    (search: string) =>
      updateSearchParams({ patientsSearch: search, patientsPage: 1 }),
    [updateSearchParams],
  );

  const handleCliniciansSort = useCallback(
    (sort: string) =>
      updateSearchParams({ cliniciansSort: sort, cliniciansPage: 1 }),
    [updateSearchParams],
  );

  const handleCliniciansSearch = useCallback(
    (search: string) =>
      updateSearchParams({ cliniciansSearch: search, cliniciansPage: 1 }),
    [updateSearchParams],
  );

  const handlePrescriptionsSort = useCallback(
    (sort: string) =>
      updateSearchParams({ prescriptionsSort: sort, prescriptionsPage: 1 }),
    [updateSearchParams],
  );

  const handlePrescriptionsSearch = useCallback(
    (search: string) =>
      updateSearchParams({
        prescriptionsSearch: search,
        prescriptionsPage: 1,
      }),
    [updateSearchParams],
  );

  const handleSaveClinicSettings = useCallback(
    (_clinicId: string, payload: ClinicSettingsPayload) => {
      const formData = new FormData();
      formData.append('actionType', 'updateClinicSettings');
      // Only the fields the user changed are appended, so the action calls
      // only the endpoints whose value actually changed.
      if (payload.tier !== undefined) {
        formData.append('tier', payload.tier);
      }
      if (payload.timezone !== undefined) {
        formData.append('timezone', payload.timezone);
      }
      if (payload.mrnRequired !== undefined) {
        formData.append('mrnRequired', payload.mrnRequired.toString());
      }
      if (payload.mrnUnique !== undefined) {
        formData.append('mrnUnique', payload.mrnUnique.toString());
      }
      if (payload.hardLimitPlan !== undefined) {
        formData.append(
          'hardLimitPlan',
          payload.hardLimitPlan === null
            ? ''
            : payload.hardLimitPlan.toString(),
        );
      }

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handleDeleteClinic = useCallback(() => {
    const formData = new FormData();
    formData.append('actionType', 'deleteClinic');

    submit(formData, { method: 'post' });
  }, [submit]);

  const handleRevokeClinicianInvite = useCallback(
    (inviteId: string) => {
      const formData = new FormData();
      formData.append('actionType', 'revokeClinicianInvite');
      formData.append('inviteId', inviteId);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handleRemoveClinician = useCallback(
    (clinicianId: string) => {
      const formData = new FormData();
      formData.append('actionType', 'removeClinician');
      formData.append('clinicianId', clinicianId);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handleRevokePatientInvite = useCallback(
    (inviteId: string) => {
      const formData = new FormData();
      formData.append('actionType', 'revokePatientInvite');
      formData.append('inviteId', inviteId);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  // Check if we're currently submitting any action
  const isSubmitting = navigation.state === 'submitting';

  // If we're on a nested route, render the outlet
  if (isNestedRoute) {
    return (
      <RecentItemsProvider
        initialPatients={(recentPatients as RecentPatient[]) || []}
        initialClinicians={(recentClinicians as RecentClinician[]) || []}
        initialPrescriptions={
          (recentPrescriptions as RecentPrescription[]) || []
        }
      >
        <div className="flex w-full">
          <Outlet />
        </div>
      </RecentItemsProvider>
    );
  }

  // Otherwise, render the clinic profile
  return (
    <RecentItemsProvider
      initialPatients={(recentPatients as RecentPatient[]) || []}
      initialClinicians={(recentClinicians as RecentClinician[]) || []}
      initialPrescriptions={(recentPrescriptions as RecentPrescription[]) || []}
    >
      <div className="flex w-full">
        {clinic && (
          <ClinicProfile
            clinic={clinic}
            patients={patients}
            patientsState={patientsState}
            totalPatients={pagination.totalPatients}
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            patientInvites={patientInvites}
            patientInvitesState={patientInvitesState}
            totalInvites={invitesPagination.totalInvites}
            clinicians={clinicians}
            cliniciansState={cliniciansState}
            totalClinicians={cliniciansPagination.totalClinicians}
            cliniciansTotalPages={cliniciansPagination.totalPages}
            cliniciansCurrentPage={cliniciansPagination.currentPage}
            cliniciansPageSize={cliniciansPagination.pageSize}
            clinicianInvites={clinicianInvites}
            clinicianInvitesState={clinicianInvitesState}
            totalClinicianInvites={invitesPagination.totalClinicianInvites}
            prescriptions={prescriptions}
            prescriptionsState={prescriptionsState}
            totalPrescriptions={prescriptionsPagination.totalPrescriptions}
            prescriptionsTotalPages={prescriptionsPagination.totalPages}
            prescriptionsCurrentPage={prescriptionsPagination.currentPage}
            prescriptionsPageSize={prescriptionsPagination.pageSize}
            onPrescriptionsPageChange={handlePrescriptionsPageChange}
            mrnSettings={mrnSettings}
            patientCountSettings={patientCountSettings}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            currentSort={sorting.sort}
            currentSearch={sorting.patientsSearch}
            onCliniciansPageChange={handleCliniciansPageChange}
            onCliniciansSearch={handleCliniciansSearch}
            currentCliniciansSearch={sorting.cliniciansSearch}
            onCliniciansSort={handleCliniciansSort}
            currentCliniciansSort={sorting.cliniciansSort}
            onPrescriptionsSearch={handlePrescriptionsSearch}
            currentPrescriptionsSearch={sorting.prescriptionsSearch}
            onPrescriptionsSort={handlePrescriptionsSort}
            currentPrescriptionsSort={sorting.prescriptionsSort}
            onSaveClinicSettings={handleSaveClinicSettings}
            onDeleteClinic={handleDeleteClinic}
            onRevokeClinicianInvite={handleRevokeClinicianInvite}
            onRemoveClinician={handleRemoveClinician}
            onRevokePatientInvite={handleRevokePatientInvite}
            isSubmitting={isSubmitting}
            selectedTab={currentTab || undefined}
            onTabChange={handleTabChange}
          />
        )}
      </div>
    </RecentItemsProvider>
  );
}
