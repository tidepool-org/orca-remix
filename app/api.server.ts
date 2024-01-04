import { serverAuth } from './auth.server';

export const apiRoutes = {
  user: {
    get: (search: string) => ({
      method: 'get',
      path: '/auth/user/' + search,
    }),
  },
  clinic: {
    get: (search: string) => ({
      method: 'get',
      path: '/v1/clinics/' + search,
    }),
    getByShareCode: (search: string) => ({
      method: 'get',
      path: '/v1/clinics/share_code/' + search,
    }),
  },
};

type apiRequestArgs = {
  path: string;
  method: string;
};

export const apiRequest = async ({ path, method }: apiRequestArgs) => {
  try {
    const serverTokenData = await fetch(`${process.env.API_HOST}${path}`, {
      method,
      headers: {
        'x-tidepool-session-token': serverAuth.serverSessionToken,
      },
    });

    const result = await serverTokenData;
    return result.json();
  } catch (e) {
    console.error(e);
  }
};
