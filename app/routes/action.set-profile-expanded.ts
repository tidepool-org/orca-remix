import { type ActionFunctionArgs, data } from 'react-router';
import { profileExpandedSession } from '~/sessions.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const profileType = formData.get('profileType') as string;
  const expanded = formData.get('expanded') === 'true';

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
