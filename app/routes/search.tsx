import { redirect, LoaderFunctionArgs } from 'react-router';

/**
 * Redirect route for Chrome custom search engine integration.
 *
 * Chrome shortcut: https://orca-remix-qa2.qa.tidepool.org/search?q=%s
 * Keyword: orca
 *
 * Determines the target page based on the query:
 * - Email addresses → /users
 * - Share codes (XXXX-XXXX-XXXX) → /clinics
 * - Exactly 24 hex chars → /clinics (clinic IDs)
 * - Everything else → /users
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();

  if (!query) return redirect('/');

  const route = getSearchRoute(query);
  return redirect(`${route}?search=${encodeURIComponent(query)}`);
}

function getSearchRoute(value: string): string {
  if (value.includes('@')) return '/users';

  const shareCodeRegex =
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
  if (shareCodeRegex.test(value)) return '/clinics';

  const clinicIdRegex = /^[a-f0-9]{24}$/;
  if (clinicIdRegex.test(value)) return '/clinics';

  return '/users';
}
