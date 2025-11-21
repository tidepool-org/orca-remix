import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { apiRequest, apiRoutes } from '~/api.server';
import { cliniciansSession } from '~/clinicians-sessions.server';
import ClinicianProfile from '~/components/Clinic/ClinicianProfile';
import type { Clinician, RecentClinician } from '~/components/Clinic/types';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { clinicId, clinicianId } = params;

  if (!clinicId || !clinicianId) {
    throw new Response('Not found', { status: 404 });
  }

  try {
    // Get all clinicians for this clinic to find the specific clinician
    const cliniciansResponse = await apiRequest(
      apiRoutes.clinic.getClinicians(clinicId, { limit: 1000 })
    );
    
    // Find the specific clinician
    const clinician = cliniciansResponse?.data?.find((c: Clinician) => c.id === clinicianId);

    if (!clinician) {
      throw new Response('Clinician not found', { status: 404 });
    }

    // Update recent clinicians session
    const { getSession, commitSession } = cliniciansSession;
    const cliniciansSessionData = await getSession(request.headers.get('Cookie'));
    const recentCliniciansData = cliniciansSessionData.get('recentClinicians');
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
      fullName: clinician.fullName,
      email: clinician.email,
      role: clinician.role,
      lastViewedAt: new Date().toISOString(),
    };

    // Remove existing entry if present
    recentClinicians = recentClinicians.filter(c => c.id !== clinician.id);
    // Add to beginning of array
    recentClinicians.unshift(recentClinician);
    // Keep only last 10
    recentClinicians = recentClinicians.slice(0, 10);

    // Update session
    cliniciansSessionData.set('recentClinicians', JSON.stringify(recentClinicians));

    return json(
      { clinician },
      {
        headers: {
          'Set-Cookie': await commitSession(cliniciansSessionData),
        },
      }
    );
  } catch (error) {
    console.error('Error loading clinician:', error);
    throw new Response('Failed to load clinician', { status: 500 });
  }
};

export default function ClinicianRoute() {
  const { clinician } = useLoaderData<typeof loader>();

  return <ClinicianProfile clinician={clinician} />;
}