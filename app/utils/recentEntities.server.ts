import type { Cookie, Session } from 'react-router';
import isArray from 'lodash/isArray';
import uniq from 'lodash/uniq';
import { clinicsSession } from '~/sessions.server';
import type { RecentClinic } from '~/components/Clinic/types';

/** Max clinics tracked in `__clinics`, and the bound on clinic-scoped keys. */
export const recentClinicsMax = 10;

/** Clinic-scoped cookie keys are `${prefix}-${clinicId}`. */
export const clinicScopedPrefixes = {
  patients: 'patients',
  clinicians: 'recentClinicians',
  prescriptions: 'recentPrescriptions',
} as const;

export type ClinicScopedPrefix =
  (typeof clinicScopedPrefixes)[keyof typeof clinicScopedPrefixes];

/** Utility to spell out the key shape for consistent reuse throughout the application. */
function clinicScopedKey(prefix: ClinicScopedPrefix, clinicId: string): string {
  return `${prefix}-${clinicId}`;
}

/** Clinic ids tracked in `__clinics`, most recent first. */
export async function getRecentClinicIds(
  cookieHeader: string | null,
): Promise<string[]> {
  const session = await clinicsSession.getSession(cookieHeader);
  const clinics = session.get('clinics');
  return isArray(clinics)
    ? (clinics as RecentClinic[]).map((clinic) => clinic?.id).filter(Boolean)
    : [];
}

/**
 * Clinic ids to keep scoped keys for while viewing `clinicId`.
 *
 * `clinicId` is added explicitly: the parent loader writes it to `__clinics`
 * concurrently with this request, so it isn't in the incoming cookie yet.
 */
export async function getKeepClinicIds(
  clinicId: string,
  cookieHeader: string | null,
): Promise<string[]> {
  const tracked = await getRecentClinicIds(cookieHeader);
  return uniq([clinicId, ...tracked]).slice(0, recentClinicsMax);
}

/**
 * Drop `${prefix}-*` keys for clinics outside `keepClinicIds`.
 *
 * `action.recent-entities` reads only the clinics still in `__clinics`, so keys
 * outside that set are unreadable: weight on every request to the origin,
 * patient names and emails included.
 */
export function pruneClinicScopedKeys(
  session: Session,
  prefix: ClinicScopedPrefix,
  keepClinicIds: Iterable<string>,
): void {
  const keep = new Set(keepClinicIds);

  for (const key of Object.keys(session.data)) {
    if (!key.startsWith(`${prefix}-`)) continue;
    if (keep.has(key.slice(prefix.length + 1))) continue;
    session.unset(key);
  }
}

/**
 * Read one clinic's recents list. Anything but an array reads as empty, so a
 * corrupt or hand-edited cookie costs the list rather than the request.
 */
export function readClinicScopedList<T>(
  session: Session,
  prefix: ClinicScopedPrefix,
  clinicId: string,
): T[] {
  const raw = session.get(clinicScopedKey(prefix, clinicId));
  return isArray(raw) ? (raw as T[]) : [];
}

/** Write one clinic's recents list. */
export function writeClinicScopedList<T>(
  session: Session,
  prefix: ClinicScopedPrefix,
  clinicId: string,
  entries: T[],
): void {
  session.set(clinicScopedKey(prefix, clinicId), entries);
}

/** Browsers reject cookies past this; React Router throws rather than truncate. */
export const maxCookieBytes = 4096;

/**
 * Shed clinic-scoped history — untracked clinics, then all but the viewed one,
 * then all of it — until the cookie fits, rather than 500ing the route.
 *
 * Serializes rather than committing and catching: `commitSession` is this same
 * call plus the length check, so measuring directly keeps a signing or config
 * error from reading as an overflow.
 *
 * Safe at commit time because each loader reads only its own clinic's key, which
 * is never pruned.
 */
export async function commitClinicScopedSession(
  session: Session,
  prefix: ClinicScopedPrefix,
  clinicId: string,
  cookieHeader: string | null,
  cookie: Cookie,
): Promise<string> {
  const keepClinicIds = await getKeepClinicIds(clinicId, cookieHeader);

  let serialized = '';
  for (const keep of [keepClinicIds, [clinicId], []]) {
    pruneClinicScopedKeys(session, prefix, keep);
    serialized = await cookie.serialize(session.data);
    if (serialized.length <= maxCookieBytes) return serialized;
  }

  // Unreachable unless non-clinic-scoped data fills the cookie alone. Returning
  // it oversized lets the browser drop the cookie; throwing would 500.
  return serialized;
}
