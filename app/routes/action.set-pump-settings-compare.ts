import { type ActionFunctionArgs, data } from 'react-router';
import { pumpSettingsCompareSession } from '~/sessions.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const compareToPrevious = formData.get('compareToPrevious') === 'true';

  const session = await pumpSettingsCompareSession.getSession(
    request.headers.get('Cookie'),
  );
  session.set('compareToPrevious', compareToPrevious);

  return data(
    { ok: true },
    {
      headers: {
        'Set-Cookie': await pumpSettingsCompareSession.commitSession(session),
      },
    },
  );
};
