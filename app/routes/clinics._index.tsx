import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from 'react-router';

import ClinicLookup from '~/components/Clinic/ClinicLookup';
import RecentClinics from '~/components/Clinic/RecentClinics';
import type { RecentClinic } from '~/components/Clinic/types';
import { apiRequest, apiRoutes } from '~/api.server';
import { clinicsSession } from '~/sessions.server';
import { useLoaderData } from 'react-router';
import isArray from 'lodash/isArray';
import { ClinicSchema, ClinicSearchSchema } from '~/schemas';
import { getErrorMessage, APIError } from '~/utils/errors';

export const meta: MetaFunction = () => {
  return [
    { title: 'Clinics | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Clinics' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const { getSession } = clinicsSession;
  const recentlyViewed = await getSession(request.headers.get('Cookie'));

  // We store recently viewed clinics in session storage for easy retrieval
  const recentClinics: RecentClinic[] = isArray(recentlyViewed.get('clinics'))
    ? recentlyViewed.get('clinics')
    : [];

  if (search) {
    try {
      // Validate search input
      const validated = ClinicSearchSchema.parse({ search });

      // Share code format: XXXX-XXXX-XXXX (uppercase letters and numbers, no vowels or 0/1)
      const shareCodePattern =
        /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
      const isShareCode = shareCodePattern.test(validated.search);

      const apiRoute = isShareCode
        ? apiRoutes.clinic.getByShareCode
        : apiRoutes.clinic.get;

      const clinic = await apiRequest({
        ...apiRoute(validated.search),
        schema: ClinicSchema,
      });

      const { id: clinicId } = clinic;

      if (clinicId) {
        return redirect(`/clinics/${clinicId}`);
      }
    } catch (error) {
      // Determine error type:
      // - APIError = server error (show in toast)
      // - ZodError with 'search' path = input validation (show inline)
      // - Other ZodError = response validation failure (show in toast)
      const isAPIError =
        error instanceof APIError ||
        (error instanceof Error && error.name === 'APIError');
      const isInputValidation =
        !isAPIError &&
        error instanceof Error &&
        error.name === 'ZodError' &&
        error.message.includes('search');

      return {
        recentClinics,
        error: getErrorMessage(error),
        errorType: isAPIError
          ? 'api'
          : isInputValidation
            ? 'validation'
            : ('api' as const),
      };
    }
  }

  return { recentClinics };
}

export default function Clinics() {
  const data = useLoaderData<typeof loader>();
  const { recentClinics } = data;

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
      <ClinicLookup
        error={'error' in data ? data.error : undefined}
        errorType={'errorType' in data ? data.errorType : 'validation'}
      />
      <RecentClinics rows={recentClinics} />
    </div>
  );
}
