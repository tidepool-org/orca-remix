import type { Session } from 'react-router';
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
  const raw = session.get(`${prefix}-${clinicId}`);
  return isArray(raw) ? (raw as T[]) : [];
}

/**
 * Prune untracked clinics, then commit, shedding more if it still won't fit.
 *
 * React Router throws rather than truncating past 4096 bytes, which 500s the
 * route until the user clears cookies; two clinics' worth of clinicians reaches
 * it. Fall back to the viewed clinic alone, then to no recents, rather than
 * failing the page.
 *
 * Pruning at commit time is safe because each loader reads only its own clinic's
 * key, which is never pruned.
 */
export async function commitClinicScopedSession(
  session: Session,
  prefix: ClinicScopedPrefix,
  clinicId: string,
  cookieHeader: string | null,
  commit: (session: Session) => Promise<string>,
): Promise<string> {
  const keepClinicIds = await getKeepClinicIds(clinicId, cookieHeader);

  for (const keep of [keepClinicIds, [clinicId], []]) {
    pruneClinicScopedKeys(session, prefix, keep);
    try {
      return await commit(session);
    } catch {
      // Too large — fall through to a narrower keep set.
    }
  }
  return commit(session);
}
