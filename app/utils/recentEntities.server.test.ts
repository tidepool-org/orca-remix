import { beforeAll, describe, expect, it } from 'vitest';
import { createSession } from 'react-router';

type RecentEntitiesModule = typeof import('~/utils/recentEntities.server');
type SessionsModule = typeof import('~/sessions.server');

let recentEntities: RecentEntitiesModule;
let sessions: SessionsModule;

// `sessions.server` throws at import time without a secret, and ESM imports are
// hoisted above assignments, so both modules load dynamically here.
beforeAll(async () => {
  process.env.SESSION_SECRET ||= 'test-secret';
  recentEntities = await import('~/utils/recentEntities.server');
  sessions = await import('~/sessions.server');
});

describe('pruneClinicScopedKeys', () => {
  it('removes keys for clinics no longer tracked and keeps the rest', () => {
    const session = createSession({
      'patients-clinic-a': [{ id: 'p1' }],
      'patients-clinic-b': [{ id: 'p2' }],
      'patients-clinic-c': [{ id: 'p3' }],
    });

    const removed = recentEntities.pruneClinicScopedKeys(session, 'patients', [
      'clinic-a',
      'clinic-c',
    ]);

    expect(removed).toBe(1);
    expect(Object.keys(session.data).sort()).toEqual([
      'patients-clinic-a',
      'patients-clinic-c',
    ]);
  });

  it('leaves keys that do not use the given prefix untouched', () => {
    const session = createSession({
      'recentClinicians-clinic-a': '[]',
      'patients-clinic-a': [{ id: 'p1' }],
    });

    const removed = recentEntities.pruneClinicScopedKeys(
      session,
      'recentClinicians',
      [],
    );

    expect(removed).toBe(1);
    expect(Object.keys(session.data)).toEqual(['patients-clinic-a']);
  });

  it('reports zero removals when every key is still tracked', () => {
    const session = createSession({ 'patients-clinic-a': [{ id: 'p1' }] });

    expect(
      recentEntities.pruneClinicScopedKeys(session, 'patients', ['clinic-a']),
    ).toBe(0);
    expect(Object.keys(session.data)).toEqual(['patients-clinic-a']);
  });
});

/** Commit `clinics` to a cookie header the way the parent clinic loader does. */
async function clinicsCookie(clinics: unknown) {
  const written = await sessions.clinicsSession.getSession();
  written.set('clinics', clinics);
  const setCookie = await sessions.clinicsSession.commitSession(written);
  return setCookie.split(';')[0];
}

describe('getRecentClinicIds', () => {
  it('reads the ids written to the clinics cookie', async () => {
    const cookieHeader = await clinicsCookie([
      { id: 'clinic-a', name: 'A', shareCode: 'AAAA' },
      { id: 'clinic-b', name: 'B', shareCode: 'BBBB' },
    ]);

    await expect(
      recentEntities.getRecentClinicIds(cookieHeader),
    ).resolves.toEqual(['clinic-a', 'clinic-b']);
  });

  it('returns an empty list when no clinics cookie is present', async () => {
    await expect(recentEntities.getRecentClinicIds(null)).resolves.toEqual([]);
  });

  it('returns an empty list when the stored value is not an array', async () => {
    const cookieHeader = await clinicsCookie({ id: 'clinic-a' });

    await expect(
      recentEntities.getRecentClinicIds(cookieHeader),
    ).resolves.toEqual([]);
  });

  it('skips entries without an id so they never widen the keep set', async () => {
    const cookieHeader = await clinicsCookie([
      { id: 'clinic-a' },
      { name: 'no id here' },
      null,
      { id: '' },
      { id: 'clinic-b' },
    ]);

    await expect(
      recentEntities.getRecentClinicIds(cookieHeader),
    ).resolves.toEqual(['clinic-a', 'clinic-b']);
  });
});

describe('getKeepClinicIds', () => {
  it('includes the clinic being viewed, which the cookie does not yet have', async () => {
    const cookieHeader = await clinicsCookie([{ id: 'clinic-a' }]);

    await expect(
      recentEntities.getKeepClinicIds('clinic-new', cookieHeader),
    ).resolves.toEqual(['clinic-new', 'clinic-a']);
  });

  it('does not repeat the viewed clinic when the cookie already tracks it', async () => {
    const cookieHeader = await clinicsCookie([
      { id: 'clinic-a' },
      { id: 'clinic-b' },
    ]);

    await expect(
      recentEntities.getKeepClinicIds('clinic-b', cookieHeader),
    ).resolves.toEqual(['clinic-b', 'clinic-a']);
  });

  // Guards the cookie-size bound: the viewed clinic plus a full tracked list is
  // recentClinicsMax + 1 ids, which would keep one more key than the parent
  // loader's tracked-clinic list does.
  it('truncates to recentClinicsMax so the key count cannot drift upward', async () => {
    const tracked = Array.from(
      { length: recentEntities.recentClinicsMax },
      (_, i) => ({ id: `clinic-${i}` }),
    );
    const cookieHeader = await clinicsCookie(tracked);

    const keep = await recentEntities.getKeepClinicIds(
      'clinic-new',
      cookieHeader,
    );

    expect(keep).toHaveLength(recentEntities.recentClinicsMax);
    expect(keep[0]).toBe('clinic-new');
    expect(keep).not.toContain(`clinic-${recentEntities.recentClinicsMax - 1}`);
  });

  it('keeps only the viewed clinic when no clinics cookie is present', async () => {
    await expect(
      recentEntities.getKeepClinicIds('clinic-new', null),
    ).resolves.toEqual(['clinic-new']);
  });
});
