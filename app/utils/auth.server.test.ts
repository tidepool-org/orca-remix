import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// auth.server reads its env vars at module load, so each test re-imports it
// after stubbing the environment.
async function loadAuth(env: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return import('./auth.server');
}

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://orca.test/', { headers });
}

function catchThrown(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
}

describe('auth.server', () => {
  beforeEach(() => {
    // Neutralise anything set in the developer's shell.
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DEV_AUTH_BYPASS', '');
    vi.stubEnv('DEV_AUTH_EMAIL', '');
    vi.stubEnv('DEV_AUTH_NAME', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('requireAuth', () => {
    it('returns the user from the Tailscale identity headers', async () => {
      const { requireAuth } = await loadAuth();

      const user = requireAuth(
        makeRequest({
          'Tailscale-User-Login': 'alice@tidepool.org',
          'Tailscale-User-Name': 'Alice Architect',
          'Tailscale-User-Profile-Pic': 'https://example.com/alice.jpg',
        }),
      );

      expect(user).toEqual({
        email: 'alice@tidepool.org',
        name: 'Alice Architect',
        picture: 'https://example.com/alice.jpg',
      });
    });

    it('returns only the email when name and picture are absent or empty', async () => {
      const { requireAuth } = await loadAuth();

      expect(
        requireAuth(
          makeRequest({ 'Tailscale-User-Login': 'bob@tidepool.org' }),
        ),
      ).toEqual({ email: 'bob@tidepool.org' });

      const withEmpty = requireAuth(
        makeRequest({
          'Tailscale-User-Login': 'bob@tidepool.org',
          'Tailscale-User-Name': '',
          'Tailscale-User-Profile-Pic': '',
        }),
      );
      expect(withEmpty.name).toBeUndefined();
      expect(withEmpty.picture).toBeUndefined();
    });

    // Encoded values below are what Go's mime.QEncoding (used by Tailscale)
    // produces, except where noted.
    it.each([
      ['a Q-encoded name', '=?utf-8?q?Ferris_B=C3=BCller?=', 'Ferris Büller'],
      [
        'a long name split into several encoded-words',
        '=?utf-8?q?Ferris_B=C3=BCller-Sch=C3=A4fer_von_M=C3=BCllerhausen_und_Gro?= =?utf-8?q?=C3=9Fwei=C3=9Fenbach?=',
        'Ferris Büller-Schäfer von Müllerhausen und Großweißenbach',
      ],
      ['a non-Latin name', '=?utf-8?q?=E6=9D=8E=E5=B0=8F=E9=BE=99?=', '李小龙'],
      [
        'a character split across encoded-words (hand-built)',
        '=?UTF-8?Q?B=C3?= =?UTF-8?Q?=BCller?=',
        'Büller',
      ],
      [
        'a B-encoded name (hand-built)',
        '=?utf-8?b?RmVycmlzIELDvGxsZXI=?=',
        'Ferris Büller',
      ],
      ['a plain ASCII name', 'a_b=c?d', 'a_b=c?d'],
      [
        'a malformed encoded-word (left as-is)',
        '=?utf-8?q?bad=ZZ?=',
        '=?utf-8?q?bad=ZZ?=',
      ],
    ])('decodes %s', async (_label, header, expected) => {
      const { requireAuth } = await loadAuth();

      const user = requireAuth(
        makeRequest({
          'Tailscale-User-Login': 'alice@tidepool.org',
          'Tailscale-User-Name': header,
        }),
      );

      expect(user.name).toBe(expected);
    });

    it('decodes a Q-encoded login', async () => {
      const { requireAuth } = await loadAuth();

      const user = requireAuth(
        makeRequest({
          'Tailscale-User-Login': '=?utf-8?q?j=C3=BCrgen@tidepool.org?=',
        }),
      );

      expect(user.email).toBe('jürgen@tidepool.org');
    });

    it.each([
      ['missing', {}],
      ['empty', { 'Tailscale-User-Login': '' }],
      ['an encoded empty string', { 'Tailscale-User-Login': '=?utf-8?q??=' }],
      [
        'missing even with a legacy Pomerium JWT',
        { 'x-pomerium-jwt-assertion': 'eyJhbGciOiJub25lIn0.e30.' },
      ],
    ])(
      'throws a 401 Response when the login header is %s',
      async (_label, headers) => {
        const { requireAuth } = await loadAuth();

        const thrown = catchThrown(() => requireAuth(makeRequest(headers)));

        expect(thrown).toBeInstanceOf(Response);
        expect((thrown as Response).status).toBe(401);
      },
    );
  });

  describe('dev auth bypass', () => {
    it('returns the mock user from DEV_AUTH_* when the login header is missing', async () => {
      const { requireAuth } = await loadAuth({
        NODE_ENV: 'development',
        DEV_AUTH_BYPASS: 'true',
        DEV_AUTH_EMAIL: 'me@tidepool.org',
        DEV_AUTH_NAME: 'Me Myself',
      });

      expect(requireAuth(makeRequest())).toEqual({
        email: 'me@tidepool.org',
        name: 'Me Myself',
      });
    });

    it('falls back to default mock values when DEV_AUTH_EMAIL/NAME are unset', async () => {
      const { requireAuth } = await loadAuth({
        NODE_ENV: 'development',
        DEV_AUTH_BYPASS: 'true',
      });

      expect(requireAuth(makeRequest())).toEqual({
        email: 'dev@localhost',
        name: 'Development User',
      });
    });

    it('prefers real identity headers over the mock user', async () => {
      const { requireAuth } = await loadAuth({
        NODE_ENV: 'development',
        DEV_AUTH_BYPASS: 'true',
      });

      const user = requireAuth(
        makeRequest({ 'Tailscale-User-Login': 'alice@tidepool.org' }),
      );

      expect(user.email).toBe('alice@tidepool.org');
    });

    it.each(['production', 'test'])(
      'is ignored when NODE_ENV is %s',
      async (nodeEnv) => {
        const { requireAuth } = await loadAuth({
          NODE_ENV: nodeEnv,
          DEV_AUTH_BYPASS: 'true',
        });

        const thrown = catchThrown(() => requireAuth(makeRequest()));

        expect((thrown as Response).status).toBe(401);
      },
    );
  });

  describe('getAuthPayload', () => {
    it('returns the user when authenticated and null otherwise', async () => {
      const { getAuthPayload } = await loadAuth();

      expect(
        getAuthPayload(
          makeRequest({ 'Tailscale-User-Login': 'alice@tidepool.org' }),
        ),
      ).toEqual({ email: 'alice@tidepool.org' });
      expect(getAuthPayload(makeRequest())).toBeNull();
    });
  });
});
