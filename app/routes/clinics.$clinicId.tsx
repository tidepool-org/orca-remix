import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  redirect,
} from 'react-router';

import ClinicProfile from '~/components/Clinic/ClinicProfile';
import type {
  Clinic,
  RecentClinic,
  Patient,
  RecentPatient,
  RecentClinician,
  ClinicianInvite,
  Prescription,
} from '~/components/Clinic/types';
import { RecentItemsProvider } from '~/components/Clinic/RecentItemsContext';
import {
  apiRequests,
  apiRoutes,
  apiRequest,
  apiRequestSafe,
} from '~/api.server';
import type { ResourceState } from '~/api.types';
import {
  clinicsSession,
  patientsSession,
  cliniciansSession,
} from '~/sessions.server';
import {
  useLoaderData,
  useSearchParams,
  useSubmit,
  useNavigation,
  Outlet,
  useLocation,
  useActionData,
} from 'react-router';
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
import { errorResponse } from '~/utils/errors';
import { useToast } from '~/contexts/ToastContext';

export const meta: MetaFunction = () => {
  return [
    { title: 'Clinic Profile | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Clinic Profile' },
  ];
};

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('actionType');
  const clinicId = params.clinicId as string;

  if (actionType === 'updateTier') {
    const tier = formData.get('tier');

    try {
      // Validate input
      const validated = UpdateTierSchema.parse({ tier });

      // Make API request (no schema validation - tier update returns empty response)
      await apiRequest({
        ...apiRoutes.clinic.updateTier(clinicId),
        body: { tier: validated.tier },
      });

      return Response.json({
        success: true,
        message: 'Clinic tier updated successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'updateTimezone') {
    const timezone = formData.get('timezone');

    try {
      // Validate input
      const validated = UpdateTimezoneSchema.parse({ timezone });

      // First fetch the current clinic data to get required fields
      const clinic = (await apiRequest(apiRoutes.clinic.get(clinicId))) as {
        name: string;
        preferredBgUnits: string;
      };

      // Make API request to update clinic with new timezone
      // Include required fields (name, preferredBgUnits) from current clinic data
      await apiRequest({
        ...apiRoutes.clinic.update(clinicId),
        body: {
          name: clinic.name,
          preferredBgUnits: clinic.preferredBgUnits,
          timezone: validated.timezone,
        },
      });

      return Response.json({
        success: true,
        message: 'Clinic timezone updated successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'updateMrnSettings') {
    const required = formData.get('mrnRequired') === 'true';
    const unique = formData.get('mrnUnique') === 'true';

    try {
      // Validate input
      const validated = MrnSettingsSchema.parse({ required, unique });

      // Make API request
      await apiRequest({
        ...apiRoutes.clinic.updateMrnSettings(clinicId),
        body: validated,
      });

      return Response.json({
        success: true,
        message: 'MRN settings updated successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
  }

  if (actionType === 'updatePatientCountSettings') {
    const hardLimitPlan = formData.get('hardLimitPlan');

    try {
      // Build patient count settings - omit hardLimit entirely to remove the limit
      // The API requires `plan` if `hardLimit` is present, so we can't send { hardLimit: {} }
      const settings: {
        hardLimit?: { plan: number };
      } = {};

      if (hardLimitPlan !== '' && hardLimitPlan !== null) {
        const planValue = parseInt(hardLimitPlan as string, 10);
        if (!isNaN(planValue) && planValue >= 0) {
          settings.hardLimit = { plan: planValue };
        }
      }
      // When hardLimitPlan is empty/null, settings remains {} (no hardLimit property)
      // which tells the API to remove any existing limit

      // Validate input
      PatientCountSettingsSchema.parse(settings);

      // Make API request
      await apiRequest({
        ...apiRoutes.clinic.updatePatientCountSettings(clinicId),
        body: settings,
      });

      return Response.json({
        success: true,
        message: 'Patient limit updated successfully',
      });
    } catch (error) {
      return errorResponse(error, 500);
    }
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

const recentClinicsMax = 10;
const defaultPageSize = 10;
const cliniciansFetchLimit = 1000;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = clinicsSession;
  const { getSession: getRecentPatientsSession } = patientsSession;
  const { getSession: getRecentCliniciansSession } = cliniciansSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));
  const recentPatientsData = await getRecentPatientsSession(
    request.headers.get('Cookie'),
  );
  const recentCliniciansData = await getRecentCliniciansSession(
    request.headers.get('Cookie'),
  );
  const url = new URL(request.url);

  // Parse pagination and sorting parameters for patients
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.max(
    1,
    Math.min(
      100,
      parseInt(url.searchParams.get('limit') || defaultPageSize.toString()),
    ),
  );
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || undefined;
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

  const clinicId = params.clinicId as string;

  // We store recently viewed clinics, patients, and clinicians in session storage
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  const recentPatients: RecentPatient[] = isArray(
    recentPatientsData.get(`patients-${clinicId}`),
  )
    ? recentPatientsData.get(`patients-${clinicId}`)
    : [];

  let recentClinicians: RecentClinician[] = [];
  try {
    const recentCliniciansString = recentCliniciansData.get(
      `recentClinicians-${clinicId}`,
    );
    if (recentCliniciansString && typeof recentCliniciansString === 'string') {
      recentClinicians = JSON.parse(recentCliniciansString);
    }
  } catch {
    recentClinicians = [];
  }

  try {
    // Fetch clinic data, patients, patient invites, and clinicians in parallel
    // Note: There is no API endpoint to list all clinician invites for a clinic
    // (GET /v1/clinics/{clinicId}/invites/clinicians doesn't exist)
    const results = await apiRequests([
      apiRoutes.clinic.get(clinicId),
      apiRoutes.clinic.getPatients(clinicId, { limit, offset, search, sort }),
      apiRoutes.clinic.getPatientInvites(clinicId),
      apiRoutes.clinic.getClinicians(clinicId, { limit: cliniciansFetchLimit }),
    ]);

    // Fetch prescriptions separately using safe wrapper to avoid breaking the page
    // Returns ResourceState which the frontend can use to show inline error
    const prescriptionsState = await apiRequestSafe<Prescription[]>(
      apiRoutes.prescription.getClinicPrescriptions(clinicId),
    );

    // Extract data for backward compatibility and compute total
    const prescriptions =
      prescriptionsState.status === 'success' ? prescriptionsState.data : [];
    const totalPrescriptions = prescriptions.length;

    // Fetch MRN settings separately to avoid breaking the page if the API is unavailable
    let mrnSettings: { required: boolean; unique: boolean } | null = null;
    try {
      mrnSettings = (await apiRequest(
        apiRoutes.clinic.getMrnSettings(clinicId),
      )) as { required: boolean; unique: boolean };
    } catch (err) {
      console.error('Error fetching MRN settings:', err);
      // Continue without MRN settings
    }

    // Fetch patient count settings separately
    let patientCountSettings: {
      hardLimit?: { plan?: number };
      softLimit?: { plan?: number };
    } | null = null;
    try {
      patientCountSettings = (await apiRequest(
        apiRoutes.clinic.getPatientCountSettings(clinicId),
      )) as {
        hardLimit?: { plan?: number };
        softLimit?: { plan?: number };
      };
    } catch (err) {
      console.error('Error fetching patient count settings:', err);
      // Continue without patient count settings
    }

    const clinic: Clinic = results?.[0] as Clinic;
    const patientsResponse = results?.[1] as
      | { data: Patient[]; meta?: { count: number } }
      | undefined;
    const patientInvitesResponse = results?.[2] as unknown[] | undefined;
    const cliniciansResponse = results?.[3] as
      | { name?: string; email?: string }[]
      | undefined;

    // Mock patient data structure for now since the actual API structure may vary
    // In a real implementation, you'd parse the actual API response
    const patients: Patient[] = patientsResponse?.data || [];
    const totalPatients = patientsResponse?.meta?.count || 0;
    const totalPages = Math.ceil(totalPatients / limit);

    // Process patient invites data
    const patientInvites = patientInvitesResponse || [];
    const totalInvites = patientInvites.length;

    // Clinician invites - not available via API (no list endpoint exists)
    // Would need GET /v1/clinics/{clinicId}/invites/clinicians but only individual invite retrieval is supported
    const clinicianInvites: ClinicianInvite[] = [];
    const totalClinicianInvites = 0;

    // Process clinicians data - we fetch all clinicians and paginate on frontend
    const allClinicians = cliniciansResponse || [];

    // Filter clinicians by search term (frontend search)
    const filteredClinicians = cliniciansSearch
      ? allClinicians.filter(
          (clinician) =>
            clinician.name
              ?.toLowerCase()
              .includes(cliniciansSearch.toLowerCase()) ||
            clinician.email
              ?.toLowerCase()
              .includes(cliniciansSearch.toLowerCase()),
        )
      : allClinicians;

    const totalClinicians = filteredClinicians.length;
    const cliniciansTotalPages = Math.ceil(totalClinicians / cliniciansLimit);

    // Slice clinicians for current page (frontend pagination)
    const startIndex = (cliniciansPage - 1) * cliniciansLimit;
    const endIndex = startIndex + cliniciansLimit;
    const clinicians = filteredClinicians.slice(startIndex, endIndex);
    if (clinic?.id) {
      recentClinics.unshift(pick(clinic, ['id', 'shareCode', 'name']));
      recentlyViewed.set(
        'clinics',
        uniqBy(recentClinics, 'id').slice(0, recentClinicsMax),
      );

      return Response.json(
        {
          clinic,
          patients,
          patientInvites,
          clinicians,
          clinicianInvites,
          prescriptions,
          prescriptionsState,
          totalPrescriptions,
          mrnSettings,
          patientCountSettings,
          recentPatients,
          recentClinicians,
          pagination: {
            currentPage: page,
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
          invitesPagination: {
            totalInvites,
            totalClinicianInvites,
          },
          sorting: {
            sort,
            search,
            cliniciansSearch,
          },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'Set-Cookie': await commitSession(recentlyViewed),
          },
        },
      );
    }
  } catch (error) {
    console.error('Error fetching clinic or patients:', error);
  }

  return {
    clinic: null,
    patients: [],
    clinicians: [],
    clinicianInvites: [],
    prescriptions: [],
    prescriptionsState: { status: 'success', data: [] } as ResourceState<
      Prescription[]
    >,
    totalPrescriptions: 0,
    mrnSettings: null,
    patientCountSettings: null,
    recentPatients: [],
    recentClinicians: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalPatients: 0,
      pageSize: defaultPageSize,
    },
    cliniciansPagination: {
      currentPage: 1,
      totalPages: 1,
      totalClinicians: 0,
      pageSize: defaultPageSize,
    },
    patientInvites: [],
    invitesPagination: {
      totalInvites: 0,
      totalClinicianInvites: 0,
    },
    sorting: {
      sort: undefined,
      search: undefined,
      cliniciansSearch: undefined,
    },
  };
}

export default function Clinics() {
  const {
    clinic,
    patients,
    patientInvites,
    clinicians,
    clinicianInvites,
    prescriptions,
    prescriptionsState,
    totalPrescriptions,
    mrnSettings,
    patientCountSettings,
    recentPatients,
    recentClinicians,
    pagination,
    cliniciansPagination,
    invitesPagination,
    sorting,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<{
    success?: boolean;
    error?: string;
    message?: string;
  }>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const navigation = useNavigation();
  const location = useLocation();
  const { showToast } = useToast();

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

  // Check if we're on a nested route (like patient, clinician, or prescription details)
  const isNestedRoute =
    location.pathname.includes('/patients/') ||
    location.pathname.includes('/clinicians/') ||
    location.pathname.includes('/prescriptions/');

  const handlePageChange = useCallback(
    (page: number) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', page.toString());
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  const handleCliniciansPageChange = useCallback(
    (page: number) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('cliniciansPage', page.toString());
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  const handleSort = useCallback(
    (sort: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('sort', sort);
      newSearchParams.set('page', '1'); // Reset to first page when sorting
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  const handleSearch = useCallback(
    (search: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (search) {
        newSearchParams.set('search', search);
      } else {
        newSearchParams.delete('search');
      }
      newSearchParams.set('page', '1'); // Reset to first page when searching
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  const handleCliniciansSearch = useCallback(
    (search: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (search) {
        newSearchParams.set('cliniciansSearch', search);
      } else {
        newSearchParams.delete('cliniciansSearch');
      }
      newSearchParams.set('cliniciansPage', '1'); // Reset to first page when searching
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  const handleTierUpdate = useCallback(
    (_clinicId: string, newTier: string) => {
      const formData = new FormData();
      formData.append('actionType', 'updateTier');
      formData.append('tier', newTier);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handleTimezoneUpdate = useCallback(
    (_clinicId: string, newTimezone: string) => {
      const formData = new FormData();
      formData.append('actionType', 'updateTimezone');
      formData.append('timezone', newTimezone);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handleMrnSettingsUpdate = useCallback(
    (_clinicId: string, mrnRequired: boolean, mrnUnique: boolean) => {
      const formData = new FormData();
      formData.append('actionType', 'updateMrnSettings');
      formData.append('mrnRequired', mrnRequired.toString());
      formData.append('mrnUnique', mrnUnique.toString());

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  const handlePatientLimitUpdate = useCallback(
    (_clinicId: string, hardLimitPlan: number | null) => {
      const formData = new FormData();
      formData.append('actionType', 'updatePatientCountSettings');
      formData.append(
        'hardLimitPlan',
        hardLimitPlan === null ? '' : hardLimitPlan.toString(),
      );

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

  // Get current tab from URL search params
  const currentTab = searchParams.get('tab') || undefined;

  // Handle tab change - persist to URL
  const handleTabChange = useCallback(
    (key: React.Key) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', key.toString());
      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );

  // Check if we're currently submitting a tier update
  const isSubmitting =
    navigation.state === 'submitting' &&
    navigation.formData?.get('actionType') === 'updateTier';

  // If we're on a nested route, render the outlet
  if (isNestedRoute) {
    return (
      <RecentItemsProvider
        initialPatients={(recentPatients as RecentPatient[]) || []}
        initialClinicians={(recentClinicians as RecentClinician[]) || []}
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
    >
      <div className="flex w-full">
        {clinic && (
          <ClinicProfile
            clinic={clinic}
            patients={patients}
            totalPatients={pagination.totalPatients}
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            patientInvites={patientInvites}
            totalInvites={invitesPagination.totalInvites}
            clinicians={clinicians}
            totalClinicians={cliniciansPagination.totalClinicians}
            cliniciansTotalPages={cliniciansPagination.totalPages}
            cliniciansCurrentPage={cliniciansPagination.currentPage}
            cliniciansPageSize={cliniciansPagination.pageSize}
            clinicianInvites={clinicianInvites}
            totalClinicianInvites={invitesPagination.totalClinicianInvites}
            prescriptions={prescriptions}
            prescriptionsState={prescriptionsState}
            totalPrescriptions={totalPrescriptions}
            mrnSettings={mrnSettings}
            patientCountSettings={patientCountSettings}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            currentSort={sorting.sort}
            currentSearch={sorting.search}
            onCliniciansPageChange={handleCliniciansPageChange}
            onCliniciansSearch={handleCliniciansSearch}
            currentCliniciansSearch={sorting.cliniciansSearch}
            onTierUpdate={handleTierUpdate}
            onTimezoneUpdate={handleTimezoneUpdate}
            onMrnSettingsUpdate={handleMrnSettingsUpdate}
            onPatientLimitUpdate={handlePatientLimitUpdate}
            onDeleteClinic={handleDeleteClinic}
            onRevokeClinicianInvite={handleRevokeClinicianInvite}
            onRemoveClinician={handleRemoveClinician}
            onRevokePatientInvite={handleRevokePatientInvite}
            isSubmitting={isSubmitting}
            selectedTab={currentTab}
            onTabChange={handleTabChange}
          />
        )}
      </div>
    </RecentItemsProvider>
  );
}

export const handle = {
  // breadcrumb: (args) => {
  // return <Link href="/clinics">Clinic Profile</Link>;
  // },
  breadcrumb: { href: '/clinics/$clinicId', label: 'Clinic Profile' },
};
