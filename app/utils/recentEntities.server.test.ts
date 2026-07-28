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

/** Commit `clinics` to a cookie header the way the parent clinic loader does. */
async function clinicsCookie(clinics: unknown) {
  const session = await sessions.clinicsSession.getSession();
  session.set('clinics', clinics);
  const setCookie = await sessions.clinicsSession.commitSession(session);
  return setCookie.split(';')[0];
}

describe('pruneClinicScopedKeys', () => {
  it('removes untracked clinics and leaves other prefixes alone', () => {
    const session = createSession({
      'patients-clinic-a': [{ id: 'p1' }],
      'patients-clinic-b': [{ id: 'p2' }],
      'recentClinicians-clinic-b': '[]',
    });

    recentEntities.pruneClinicScopedKeys(session, 'patients', ['clinic-a']);

    expect(Object.keys(session.data).sort()).toEqual([
      'patients-clinic-a',
      'recentClinicians-clinic-b',
    ]);
  });
});

describe('getRecentClinicIds', () => {
  it('reads ids from the clinics cookie, skipping entries without one', async () => {
    const cookieHeader = await clinicsCookie([
      { id: 'clinic-a', name: 'A', shareCode: 'AAAA' },
      { name: 'no id here' },
      null,
      { id: '' },
      { id: 'clinic-b' },
    ]);

    await expect(
      recentEntities.getRecentClinicIds(cookieHeader),
    ).resolves.toEqual(['clinic-a', 'clinic-b']);
  });

  it('returns an empty list with no cookie or a non-array value', async () => {
    await expect(recentEntities.getRecentClinicIds(null)).resolves.toEqual([]);
    await expect(
      recentEntities.getRecentClinicIds(await clinicsCookie({ id: 'a' })),
    ).resolves.toEqual([]);
  });
});

describe('getKeepClinicIds', () => {
  it('adds the viewed clinic without repeating it', async () => {
    const cookieHeader = await clinicsCookie([
      { id: 'clinic-a' },
      { id: 'clinic-b' },
    ]);

    await expect(
      recentEntities.getKeepClinicIds('clinic-new', cookieHeader),
    ).resolves.toEqual(['clinic-new', 'clinic-a', 'clinic-b']);
    await expect(
      recentEntities.getKeepClinicIds('clinic-b', cookieHeader),
    ).resolves.toEqual(['clinic-b', 'clinic-a']);
  });

  // The viewed clinic plus a full tracked list is recentClinicsMax + 1 ids, one
  // more key than the parent loader tracks, so the oldest has to fall off.
  it('truncates to recentClinicsMax, dropping the oldest clinic', async () => {
    const max = recentEntities.recentClinicsMax;
    const cookieHeader = await clinicsCookie(
      Array.from({ length: max }, (_, i) => ({ id: `clinic-${i}` })),
    );

    const keep = await recentEntities.getKeepClinicIds(
      'clinic-new',
      cookieHeader,
    );

    expect(keep).toEqual([
      'clinic-new',
      ...Array.from({ length: max - 1 }, (_, i) => `clinic-${i}`),
    ]);
  });
});

describe('readClinicScopedList', () => {
  const entries = [{ id: 'c1', name: 'A', email: 'a@example.com' }];

  it('reads a stored array', () => {
    const session = createSession({ 'recentClinicians-clinic-a': entries });

    expect(
      recentEntities.readClinicScopedList(
        session,
        'recentClinicians',
        'clinic-a',
      ),
    ).toEqual(entries);
  });

  it('returns an empty list for anything that is not an array', () => {
    const session = createSession({
      'recentClinicians-string': JSON.stringify(entries),
      'recentClinicians-object': { id: 'c1' },
      'recentClinicians-number': 42,
    });

    for (const clinicId of ['absent', 'string', 'object', 'number']) {
      expect(
        recentEntities.readClinicScopedList(
          session,
          'recentClinicians',
          clinicId,
        ),
      ).toEqual([]);
    }
  });
});

describe('commitClinicScopedSession', () => {
  /** Ten realistic `patients-*` entries, as the patient loader stores them. */
  const patientsFor = (clinic: number) =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `c6b4f603-39a1-4aa5-8df2-8c08cd56a${clinic}${String(i).padStart(2, '0')}`,
      fullName: 'Firstname Lastname',
      email: `person${clinic}${i}@example-clinic.com`,
    }));

  it('keeps every tracked clinic and drops the rest', async () => {
    const session = await sessions.patientsSession.getSession();
    session.set('patients-clinic-0', [{ id: 'p0' }]);
    session.set('patients-clinic-1', [{ id: 'p1' }]);
    session.set('patients-stale', [{ id: 'gone' }]);

    await recentEntities.commitClinicScopedSession(
      session,
      'patients',
      'clinic-0',
      await clinicsCookie([{ id: 'clinic-0' }, { id: 'clinic-1' }]),
      sessions.patientsSession.commitSession,
    );

    // clinic-1 is retained but not the clinic being viewed, so this fails if the
    // clinics cookie is ignored and only the viewed clinic is kept.
    expect(Object.keys(session.data).sort()).toEqual([
      'patients-clinic-0',
      'patients-clinic-1',
    ]);
  });

  it('sheds other clinics rather than throwing past the 4096-byte limit', async () => {
    const session = await sessions.patientsSession.getSession();
    const tracked = Array.from({ length: 5 }, (_, c) => ({
      id: `clinic-${c}`,
    }));
    for (let c = 0; c < 5; c++) {
      session.set(`patients-clinic-${c}`, patientsFor(c));
    }

    // Asserts the hazard is real, so this test can't rot into a tautology:
    // five clinics of ten patients is well past the limit even when all five
    // are still tracked, so pruning alone cannot save it.
    await expect(
      sessions.patientsSession.commitSession(session),
    ).rejects.toThrow(/Cookie length will exceed browser maximum/);

    const setCookie = await recentEntities.commitClinicScopedSession(
      session,
      'patients',
      'clinic-0',
      await clinicsCookie(tracked),
      sessions.patientsSession.commitSession,
    );

    expect(Object.keys(session.data)).toEqual(['patients-clinic-0']);
    expect(setCookie.split(';')[0].length).toBeLessThanOrEqual(4096);
  });
});

// `__clinicians_session` is the tightest of the three cookies, so it reaches the
// limit first. Ten clinicians across two clinics is the volume that fails when
// entries carry unused fields, which is why these entries hold only what the
// recents lists render.
describe('commitClinicScopedSession with the clinicians cookie', () => {
  const cliniciansFor = (clinic: number) =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `c6b4f603-39a1-4aa5-8df2-8c08cd56a${clinic}${String(i).padStart(2, '0')}`,
      name: 'Firstname Lastname',
      email: `person${clinic}${i}@example-clinic.com`,
    }));

  it('fits ten clinicians across two clinics with nothing shed', async () => {
    const session = await sessions.cliniciansSession.getSession();
    session.set('recentClinicians-clinic-0', cliniciansFor(0));
    session.set('recentClinicians-clinic-1', cliniciansFor(1));

    const setCookie = await recentEntities.commitClinicScopedSession(
      session,
      recentEntities.clinicScopedPrefixes.clinicians,
      'clinic-1',
      await clinicsCookie([{ id: 'clinic-1' }, { id: 'clinic-0' }]),
      sessions.cliniciansSession.commitSession,
    );

    // Both clinics keep their history: the entry size leaves enough room that
    // the shed ladder never has to run at this volume.
    expect(Object.keys(session.data).sort()).toEqual([
      'recentClinicians-clinic-0',
      'recentClinicians-clinic-1',
    ]);
    expect(setCookie.split(';')[0].length).toBeLessThanOrEqual(4096);
  });
});
