import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { apiRequest, apiRoutes } from '~/api.server';
import PrescriptionProfile from '~/components/Clinic/PrescriptionProfile';
import type { Prescription, Clinician } from '~/components/Clinic/types';

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
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { clinicId, prescriptionId } = params;

  if (!clinicId || !prescriptionId) {
    throw new Response('Not found', { status: 404 });
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

    return Response.json({
      prescription,
      prescriber,
      clinicId,
    });
  } catch (error) {
    console.error('Error loading prescription:', error);
    throw new Response('Failed to load prescription', { status: 500 });
  }
};

export default function PrescriptionRoute() {
  const { prescription, prescriber, clinicId } =
    useLoaderData<PrescriptionLoaderData>();

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
