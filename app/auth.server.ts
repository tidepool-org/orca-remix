const { SERVER_SECRET, SERVER_NAME, API_HOST } = process.env;

// Ensure they are defined and throw error if not
if (!SERVER_SECRET) throw new Error('Missing Server Secret Env.');
if (!SERVER_NAME) throw new Error('Missing Server Name Env.');
if (!API_HOST) throw new Error('Missing Server API Host Env.');

// Re-authenticate after 1 hour of token age
const TOKEN_TTL_MS = 60 * 60 * 1000;

// This object is just so we can do `auth.clientId` or another attribute instead of using the all uppercase variables
export const serverAuth = {
  serverSecret: SERVER_SECRET,
  serverName: SERVER_NAME,
  apiHost: API_HOST,
  serverSessionToken: '',
};

/** Timestamp (ms) at which the cached token should be refreshed */
let tokenExpiresAt = 0;

/** In-flight auth promise — prevents thundering herd on concurrent requests */
let pendingAuth: Promise<void> | null = null;

/**
 * Ensure a valid server session token is available.
 *
 * - Returns immediately if the cached token is still within its TTL.
 * - If an auth request is already in-flight, concurrent callers await the
 *   same promise instead of firing duplicate requests.
 */
export const authorizeServer = async (): Promise<void> => {
  // Token is still valid — nothing to do
  if (serverAuth.serverSessionToken && Date.now() < tokenExpiresAt) {
    return;
  }

  // Another caller is already refreshing — wait for it
  if (pendingAuth) {
    return pendingAuth;
  }

  pendingAuth = refreshServerToken();

  try {
    await pendingAuth;
  } finally {
    pendingAuth = null;
  }
};

/** Invalidate the cached token so the next `authorizeServer()` call re-authenticates. */
export function invalidateServerToken(): void {
  tokenExpiresAt = 0;
}

/** Perform the actual server login and cache the token. */
async function refreshServerToken(): Promise<void> {
  try {
    const serverTokenData = await fetch(
      `${process.env.API_HOST}/auth/serverlogin`,
      {
        method: 'post',
        headers: {
          'x-tidepool-server-name': serverAuth.serverName,
          'x-tidepool-server-secret': serverAuth.serverSecret,
        },
      },
    );

    if (!serverTokenData.ok) {
      throw new Error(
        `Server login failed with status ${serverTokenData.status}: ${serverTokenData.statusText}`,
      );
    }

    const serverSessionToken = serverTokenData.headers.get(
      'x-tidepool-session-token',
    );

    if (!serverSessionToken) {
      throw new Error(
        'Server authentication failed: no session token received',
      );
    }

    serverAuth.serverSessionToken = serverSessionToken;
    tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  } catch (e) {
    // Ensure stale token is cleared on failure so the next request retries
    serverAuth.serverSessionToken = '';
    tokenExpiresAt = 0;
    console.error('Server authentication failed:', e);
    throw e;
  }
}
