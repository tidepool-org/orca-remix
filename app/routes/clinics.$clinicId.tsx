import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';

import ClinicProfile from '~/components/Clinic/ClinicProfile';
import type { Clinic, RecentClinic, Patient, RecentPatient, RecentClinician } from '~/components/Clinic/types';
import { RecentItemsProvider } from '~/components/Clinic/RecentItemsContext';
import { apiRequests, apiRoutes, apiPostRequest } from '~/api.server';
import { clinicsSession, patientsSession, cliniciansSession } from '~/sessions.server';
import { useLoaderData, useSearchParams, useSubmit, useNavigation, Outlet, useLocation } from '@remix-run/react';
import { useCallback } from 'react';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';
import uniqBy from 'lodash/uniqBy';

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
    const tier = formData.get('tier') as string;

    try {
      const route = apiRoutes.clinic.updateTier(clinicId);
      await apiPostRequest({
        path: route.path,
        method: route.method,
        body: { tier }
      });

      return json({ success: true });
    } catch (error) {
      console.error('Failed to update clinic tier:', error);
      return json({ error: 'Failed to update tier' }, { status: 500 });
    }
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}

const recentClinicsMax = 10;
const defaultPageSize = 10;
const cliniciansFetchLimit = 1000;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { getSession, commitSession } = clinicsSession;
  const { getSession: getRecentPatientsSession } = patientsSession;
  const { getSession: getRecentCliniciansSession } = cliniciansSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));
  const recentPatientsData = await getRecentPatientsSession(request.headers.get('Cookie'));
  const recentCliniciansData = await getRecentCliniciansSession(request.headers.get('Cookie'));
  const url = new URL(request.url);

  // Parse pagination and sorting parameters for patients
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || defaultPageSize.toString())));
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || undefined;
  const sort = url.searchParams.get('sort') || undefined;

  // Parse pagination parameters for clinicians (frontend pagination only)
  const cliniciansPage = Math.max(1, parseInt(url.searchParams.get('cliniciansPage') || '1'));
  const cliniciansLimit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('cliniciansLimit') || defaultPageSize.toString())));
  const cliniciansSearch = url.searchParams.get('cliniciansSearch') || undefined;

  const clinicId = params.clinicId as string;

  // We store recently viewed clinics, patients, and clinicians in session storage
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  const recentPatients: RecentPatient[] = isArray(recentPatientsData.get(`patients-${clinicId}`))
    ? recentPatientsData.get(`patients-${clinicId}`)
    : [];

  let recentClinicians: RecentClinician[] = [];
  try {
    const recentCliniciansString = recentCliniciansData.get(`recentClinicians-${clinicId}`);
    if (recentCliniciansString && typeof recentCliniciansString === 'string') {
      recentClinicians = JSON.parse(recentCliniciansString);
    }
  } catch {
    recentClinicians = [];
  }

  try {
    // Fetch clinic data, patients, patient invites, and clinicians in parallel
    const results = await apiRequests([
      apiRoutes.clinic.get(clinicId),
      apiRoutes.clinic.getPatients(clinicId, { limit, offset, search, sort }),
      apiRoutes.clinic.getPatientInvites(clinicId),
      apiRoutes.clinic.getClinicians(clinicId, { limit: cliniciansFetchLimit }),
    ]);

    const clinic: Clinic = results?.[0];
    const patientsResponse = results?.[1];
    const patientInvitesResponse = results?.[2];
    const cliniciansResponse = results?.[3];

    // Mock patient data structure for now since the actual API structure may vary
    // In a real implementation, you'd parse the actual API response
    const patients: Patient[] = patientsResponse?.data || [];
    const totalPatients = patientsResponse?.meta?.count || 0;
    const totalPages = Math.ceil(totalPatients / limit);

    // Process patient invites data
    const patientInvites = patientInvitesResponse || [];
    const totalInvites = patientInvites.length;

    // Process clinicians data - we fetch all clinicians and paginate on frontend
    const allClinicians = cliniciansResponse || [];

    // Filter clinicians by search term (frontend search)
    const filteredClinicians = cliniciansSearch
      ? allClinicians.filter(clinician =>
          clinician.name?.toLowerCase().includes(cliniciansSearch.toLowerCase()) ||
          clinician.email?.toLowerCase().includes(cliniciansSearch.toLowerCase())
        )
      : allClinicians;

    const totalClinicians = filteredClinicians.length;
    const cliniciansTotalPages = Math.ceil(totalClinicians / cliniciansLimit);

    // Slice clinicians for current page (frontend pagination)
    const startIndex = (cliniciansPage - 1) * cliniciansLimit;
    const endIndex = startIndex + cliniciansLimit;
    const clinicians = filteredClinicians.slice(startIndex, endIndex);    if (clinic?.id) {
      recentClinics.unshift(pick(clinic, ['id', 'shareCode', 'name']));
      recentlyViewed.set(
        'clinics',
        uniqBy(recentClinics, 'id').slice(0, recentClinicsMax),
      );

      return json(
        {
          clinic,
          patients,
          patientInvites,
          clinicians,
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
    recentPatients,
    recentClinicians,
    pagination,
    cliniciansPagination,
    invitesPagination,
    sorting,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const navigation = useNavigation();
  const location = useLocation();

  // Check if we're on a nested route (like patient or clinician details)
  const isNestedRoute = location.pathname.includes('/patients/') || location.pathname.includes('/clinicians/');

  const handlePageChange = useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    submit(newSearchParams, { method: 'GET', replace: true });
  }, [searchParams, submit]);

  const handleCliniciansPageChange = useCallback((page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('cliniciansPage', page.toString());
    submit(newSearchParams, { method: 'GET', replace: true });
  }, [searchParams, submit]);

  const handleSort = useCallback((sort: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('sort', sort);
    newSearchParams.set('page', '1'); // Reset to first page when sorting
    submit(newSearchParams, { method: 'GET', replace: true });
  }, [searchParams, submit]);

  const handleSearch = useCallback((search: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (search) {
      newSearchParams.set('search', search);
    } else {
      newSearchParams.delete('search');
    }
    newSearchParams.set('page', '1'); // Reset to first page when searching
    submit(newSearchParams, { method: 'GET', replace: true });
  }, [searchParams, submit]);

  const handleCliniciansSearch = useCallback((search: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (search) {
      newSearchParams.set('cliniciansSearch', search);
    } else {
      newSearchParams.delete('cliniciansSearch');
    }
    newSearchParams.set('cliniciansPage', '1'); // Reset to first page when searching
    submit(newSearchParams, { method: 'GET', replace: true });
  }, [searchParams, submit]);

  const handleTierUpdate = useCallback((clinicId: string, newTier: string) => {
    const formData = new FormData();
    formData.append('actionType', 'updateTier');
    formData.append('tier', newTier);

    submit(formData, { method: 'post' });
  }, [submit]);

  // Check if we're currently submitting a tier update
  const isSubmitting = navigation.state === 'submitting' &&
    navigation.formData?.get('actionType') === 'updateTier';

  // If we're on a nested route, render the outlet
  if (isNestedRoute) {
    return (
      <RecentItemsProvider initialPatients={(recentPatients as RecentPatient[]) || []} initialClinicians={(recentClinicians as RecentClinician[]) || []}>
        <div className="flex w-full">
          <Outlet />
        </div>
      </RecentItemsProvider>
    );
  }

  // Otherwise, render the clinic profile
  return (
    <RecentItemsProvider initialPatients={(recentPatients as RecentPatient[]) || []} initialClinicians={(recentClinicians as RecentClinician[]) || []}>
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
            recentPatients={recentPatients}
            recentClinicians={recentClinicians}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            currentSort={sorting.sort}
            currentSearch={sorting.search}
            onCliniciansPageChange={handleCliniciansPageChange}
            onCliniciansSearch={handleCliniciansSearch}
            currentCliniciansSearch={sorting.cliniciansSearch}
            onTierUpdate={handleTierUpdate}
            isSubmitting={isSubmitting}
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
