import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useParams } from 'react-router';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import { apiRequest, apiRoutes } from '~/api.server';
import { cliniciansSession } from '~/sessions.server';
import ClinicianProfile from '~/components/Clinic/ClinicianProfile';
import type {
  RecentClinician,
  Clinician,
  ClinicianClinicMembership,
} from '~/components/Clinic/types';
import { useEffect } from 'react';
import { APIError } from '~/utils/errors';

type ClinicianLoaderData = {
  clinician: Clinician;
  recentClinicians: RecentClinician[];
  clinics: ClinicianClinicMembership[];
  totalClinics: number;
};

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
    const clinicsResponseTyped = clinicsResponse as
      | { data?: unknown[]; meta?: { count?: number } }
      | unknown[];
    const clinics = Array.isArray(clinicsResponseTyped)
      ? clinicsResponseTyped
      : (clinicsResponseTyped as { data?: unknown[] })?.data || [];
    const totalClinics = Array.isArray(clinicsResponseTyped)
      ? clinicsResponseTyped.length
      : (clinicsResponseTyped as { meta?: { count?: number } })?.meta?.count ||
        clinics.length;

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
    const clinicianTyped = clinician as Clinician;
    const recentClinician: RecentClinician = {
      id: clinicianTyped.id,
      name: clinicianTyped.name,
      email: clinicianTyped.email,
      roles: clinicianTyped.roles,
      lastViewedAt: new Date().toISOString(),
    };

    // Remove existing entry if present
    recentClinicians = recentClinicians.filter(
      (c) => c.id !== clinicianTyped.id,
    );
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

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { clinicId, clinicianId } = params;

  if (!clinicId || !clinicianId) {
    return Response.json(
      { error: 'Missing clinic or clinician ID' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'update-roles') {
    const rolesJson = formData.get('roles');

    if (!rolesJson || typeof rolesJson !== 'string') {
      return Response.json({ error: 'Invalid roles data' }, { status: 400 });
    }

    try {
      const roles = JSON.parse(rolesJson) as string[];

      // Validate that we have at least one base role
      const hasBaseRole = roles.some(
        (r) => r === 'CLINIC_ADMIN' || r === 'CLINIC_MEMBER',
      );
      if (!hasBaseRole) {
        return Response.json(
          {
            error:
              'Clinician must have either CLINIC_ADMIN or CLINIC_MEMBER role',
          },
          { status: 400 },
        );
      }

      // Update the clinician roles via the API
      await apiRequest({
        ...apiRoutes.clinic.updateClinician(clinicId, clinicianId),
        body: { roles },
      });

      return Response.json({ success: true });
    } catch (error) {
      console.error('Error updating clinician roles:', error);
      if (error instanceof APIError) {
        return Response.json(
          { error: error.message },
          { status: error.status || 500 },
        );
      }
      return Response.json(
        { error: 'Failed to update clinician roles' },
        { status: 500 },
      );
    }
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
};

export default function ClinicianRoute() {
  const { clinician, clinics, totalClinics } =
    useLoaderData<ClinicianLoaderData>();
  const { clinicId } = useParams();
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
      clinicId={clinicId}
    />
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'Clinician Profile' },
};
