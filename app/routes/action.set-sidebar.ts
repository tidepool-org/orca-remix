import { type ActionFunctionArgs, data } from 'react-router';
import { sidebarSession } from '~/sessions.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const expanded = formData.get('expanded') === 'true';

  const session = await sidebarSession.getSession(
    request.headers.get('Cookie'),
  );
  session.set('expanded', expanded);

  return data(
    { ok: true },
    { headers: { 'Set-Cookie': await sidebarSession.commitSession(session) } },
  );
};
