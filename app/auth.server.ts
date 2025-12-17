const { SERVER_SECRET, SERVER_NAME, API_HOST } = process.env;

// Ensure they are defined and throw error if not
if (!SERVER_SECRET) throw new Error('Missing Server Secret Env.');
if (!SERVER_NAME) throw new Error('Missing Server Name Env.');
if (!API_HOST) throw new Error('Missing Server API Host Env.');

// This object is just so we can do `auth.clientId` or another attribute instead of using the all uppercase variables
export const serverAuth = {
  serverSecret: SERVER_SECRET,
  serverName: SERVER_NAME,
  apiHost: API_HOST,
  serverSessionToken: '',
};

export const authorizeServer = async () => {
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
  } catch (e) {
    console.error('Server authentication failed:', e);
    throw e;
  }
};
