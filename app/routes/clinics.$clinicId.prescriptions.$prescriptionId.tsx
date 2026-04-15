import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { useEffect } from 'react';
import { apiRequest, apiRoutes } from '~/api.server';
import { prescriptionsSession } from '~/sessions.server';
import { useRecentItems } from '~/components/Clinic/RecentItemsContext';
import PrescriptionProfile from '~/components/Clinic/PrescriptionProfile';
import { getPatientName } from '~/utils/prescriptions';
import type {
  Prescription,
  Clinician,
  RecentPrescription,
} from '~/components/Clinic/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Prescription Details | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Prescription Details' },
  ];
};

type PrescriptionLoaderData = {
  prescription: Prescription;
  prescriber: Clinician | null;
  clinicId: string;
  recentPrescriptions: RecentPrescription[];
};

const recentPrescriptionsMax = 10;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { clinicId, prescriptionId } = params;

  if (!clinicId || !prescriptionId) {
    throw new Response('Not found', { status: 404 });
  }

  const { getSession, commitSession } = prescriptionsSession;
  const sessionData = await getSession(request.headers.get('Cookie'));

  let recentPrescriptions: RecentPrescription[] = [];
  try {
    const raw = sessionData.get(`recentPrescriptions-${clinicId}`);
    if (raw && typeof raw === 'string') {
      recentPrescriptions = JSON.parse(raw);
    }
  } catch {
    recentPrescriptions = [];
  }

  try {
    // Get the prescription
    const prescription = (await apiRequest(
      apiRoutes.prescription.getPrescription(clinicId, prescriptionId),
    )) as Prescription;

    if (!prescription) {
      throw new Response('Prescription not found', { status: 404 });
    }

    // Try to get the prescriber clinician info if we have a prescriberUserId
    let prescriber: Clinician | null = null;
    if (prescription.prescriberUserId) {
      try {
        prescriber = (await apiRequest(
          apiRoutes.clinic.getClinician(
            clinicId,
            prescription.prescriberUserId,
          ),
        )) as Clinician;
      } catch {
        // If we can't fetch the prescriber, that's okay - continue without it
        console.warn(
          `Could not fetch prescriber ${prescription.prescriberUserId}`,
        );
      }
    }

    // Add current prescription to recent list
    const recentPrescription: RecentPrescription = {
      id: prescription.id,
      patientName: getPatientName(prescription),
      state: prescription.state,
    };

    recentPrescriptions = recentPrescriptions.filter(
      (p) => p.id !== prescription.id,
    );
    recentPrescriptions.unshift(recentPrescription);
    recentPrescriptions = recentPrescriptions.slice(0, recentPrescriptionsMax);

    sessionData.set(
      `recentPrescriptions-${clinicId}`,
      JSON.stringify(recentPrescriptions),
    );

    return Response.json(
      {
        prescription,
        prescriber,
        clinicId,
        recentPrescriptions,
      },
      {
        headers: {
          'Set-Cookie': await commitSession(sessionData),
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('Error loading prescription:', error);
    throw new Response('Failed to load prescription', { status: 500 });
  }
};

export default function PrescriptionRoute() {
  const { prescription, prescriber, clinicId, recentPrescriptions } =
    useLoaderData<PrescriptionLoaderData>();
  const { addRecentPrescription, updateRecentPrescriptions } = useRecentItems();

  // Sync session data into context and add current prescription
  useEffect(() => {
    if (recentPrescriptions) {
      updateRecentPrescriptions(recentPrescriptions);
    }
    if (prescription) {
      addRecentPrescription({
        id: prescription.id,
        patientName: getPatientName(prescription),
        state: prescription.state,
      });
    }
  }, [
    prescription,
    recentPrescriptions,
    addRecentPrescription,
    updateRecentPrescriptions,
  ]);

  return (
    <PrescriptionProfile
      prescription={prescription}
      prescriber={prescriber}
      clinicId={clinicId}
    />
  );
}

export const handle = {
  breadcrumb: { href: '#', label: 'Prescription Details' },
};
