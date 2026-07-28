import type { Session } from 'react-router';
import isArray from 'lodash/isArray';
import uniq from 'lodash/uniq';
import { clinicsSession } from '~/sessions.server';
import type { RecentClinic } from '~/components/Clinic/types';

/**
 * Max number of clinics tracked in the `__clinics` cookie. The clinic-scoped
 * caches (`__patients_session`, `__clinicians_session`,
 * `__prescriptions_session`) are pruned to this same set of clinics so their
 * key count stays bounded.
 */
export const recentClinicsMax = 10;

/**
 * Key prefixes used by the clinic-scoped recent-entity cookies. Each key is
 * `${prefix}-${clinicId}`.
 */
export const clinicScopedPrefixes = {
  patients: 'patients',
  clinicians: 'recentClinicians',
  prescriptions: 'recentPrescriptions',
} as const;

export type ClinicScopedPrefix =
  (typeof clinicScopedPrefixes)[keyof typeof clinicScopedPrefixes];

/** Clinic ids currently tracked in the `__clinics` cookie, most recent first. */
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
 * The clinic ids whose scoped cache keys should be retained while viewing
 * `clinicId`.
 *
 * `clinicId` is included explicitly because sibling loaders run in parallel: the
 * `__clinics` cookie on the current request does not yet contain the clinic
 * being viewed, since the parent loader writes it concurrently with this one.
 * Truncating to `recentClinicsMax` keeps this in step with the tracked-clinic
 * list the parent writes, so the two never disagree about what to keep.
 */
export async function getKeepClinicIds(
  clinicId: string,
  cookieHeader: string | null,
): Promise<string[]> {
  const tracked = await getRecentClinicIds(cookieHeader);
  return uniq([clinicId, ...tracked]).slice(0, recentClinicsMax);
}

/**
 * Drop `${prefix}-${clinicId}` keys for clinics no longer in `keepClinicIds`.
 *
 * These cookies gain a key per clinic visited and nothing ever removed them.
 * React Router rejects any single cookie over 4096 bytes by throwing
 * ("Cookie length will exceed browser maximum"), so an unbounded key count
 * eventually turns every load of an affected route into a 500 — reachable at
 * roughly three clinics' worth of entries. Pruning also keeps the patient names
 * and emails in these cookies off requests for clinics the user has moved on
 * from.
 *
 * Only the loaders that write these keys call this; see the note in
 * `clinics.$clinicId.tsx` for why the parent clinic loader does not.
 *
 * Returns the number of keys removed, so callers can skip re-committing a
 * cookie that didn't change.
 */
export function pruneClinicScopedKeys(
  session: Session,
  prefix: ClinicScopedPrefix,
  keepClinicIds: Iterable<string>,
): number {
  const keep = new Set(keepClinicIds);
  let removed = 0;

  for (const key of Object.keys(session.data)) {
    if (!key.startsWith(`${prefix}-`)) continue;
    const clinicId = key.slice(prefix.length + 1);
    if (keep.has(clinicId)) continue;
    session.unset(key);
    removed++;
  }

  return removed;
}
