import { type ActionFunctionArgs, data } from 'react-router';
import { profileExpandedSession } from '~/sessions.server';

const VALID_PROFILE_TYPES = [
  'user',
  'patient',
  'clinician',
  'prescription',
  'clinic',
] as const;

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const profileType = formData.get('profileType');
  const expanded = formData.get('expanded') === 'true';

  if (
    typeof profileType !== 'string' ||
    !VALID_PROFILE_TYPES.includes(
      profileType as (typeof VALID_PROFILE_TYPES)[number],
    )
  ) {
    return data({ error: 'Invalid profileType' }, { status: 400 });
  }

  const session = await profileExpandedSession.getSession(
    request.headers.get('Cookie'),
  );

  const expandedMap: Record<string, boolean> = session.get('expanded') || {};
  expandedMap[profileType] = expanded;
  session.set('expanded', expandedMap);

  return data(
    { ok: true },
    {
      headers: {
        'Set-Cookie': await profileExpandedSession.commitSession(session),
      },
    },
  );
};
