import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRoutes } from '~/api.server';
import { cliniciansSession } from '~/sessions.server';
import ClinicianProfile from '~/components/Clinic/ClinicianProfile';
import type { RecentClinician } from '~/components/Clinic/types';
import { useEffect } from 'react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { clinicId, clinicianId } = params;

  if (!clinicId || !clinicianId) {
    throw new Response('Not found', { status: 404 });
  }

  try {
    // Get the specific clinician directly
    const clinician = await apiRequest(
      apiRoutes.clinic.getClinician(clinicId, clinicianId),
    );

    if (!clinician) {
      throw new Response('Clinician not found', { status: 404 });
    }

    // Get clinics for this clinician
    const clinicsResponse = await apiRequest(
      apiRoutes.clinic.getClinicsForClinician(clinicianId, {
        limit: 1000,
        offset: 0,
      }),
    );

    // Handle both array response and object with data property
    const clinics = Array.isArray(clinicsResponse)
      ? clinicsResponse
      : clinicsResponse?.data || [];
    const totalClinics = Array.isArray(clinicsResponse)
      ? clinicsResponse.length
      : clinicsResponse?.meta?.count || clinics.length;

    // Update recent clinicians session
    const { getSession, commitSession } = cliniciansSession;
    const cliniciansSessionData = await getSession(
      request.headers.get('Cookie'),
    );
    const recentCliniciansData = cliniciansSessionData.get(
      `recentClinicians-${clinicId}`,
    );
    let recentClinicians: RecentClinician[] = [];

    if (recentCliniciansData && typeof recentCliniciansData === 'string') {
      try {
        recentClinicians = JSON.parse(recentCliniciansData);
      } catch {
        recentClinicians = [];
      }
    }

    // Add current clinician to recent list
    const recentClinician: RecentClinician = {
      id: clinician.id,
      name: clinician.name,
      email: clinician.email,
      roles: clinician.roles,
      lastViewedAt: new Date().toISOString(),
    };

    // Remove existing entry if present
    recentClinicians = recentClinicians.filter((c) => c.id !== clinician.id);
    // Add to beginning of array
    recentClinicians.unshift(recentClinician);
    // Keep only last 10
    recentClinicians = recentClinicians.slice(0, 10);

    // Update session
    cliniciansSessionData.set(
      `recentClinicians-${clinicId}`,
      JSON.stringify(recentClinicians),
    );

    return Response.json(
      { clinician, recentClinicians, clinics, totalClinics },
      {
        headers: {
          'Set-Cookie': await commitSession(cliniciansSessionData),
        },
      },
    );
  } catch (error) {
    console.error('Error loading clinician:', error);
    throw new Response('Failed to load clinician', { status: 500 });
  }
};

export default function ClinicianRoute() {
  const { clinician, clinics, totalClinics } = useLoaderData<typeof loader>();
  const { addRecentClinician } = useRecentItems();

  // Add clinician to recent list immediately when component mounts
  useEffect(() => {
    if (clinician) {
      const recentClinician: RecentClinician = {
        id: clinician.id,
        name: clinician.name,
        email: clinician.email,
        roles: clinician.roles,
        lastViewedAt: new Date().toISOString(),
      };
      addRecentClinician(recentClinician);
    }
  }, [clinician, addRecentClinician]);

  return (
    <ClinicianProfile
      clinician={clinician}
      clinics={clinics}
      totalClinics={totalClinics}
    />
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'Clinician Profile' },
};
