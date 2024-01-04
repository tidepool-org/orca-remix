import { serverAuth } from './auth.server';

export const apiRoutes = {
  user: {
    get: (search: string) => ({
      method: 'get',
      path: `/auth/user/${search}`,
    }),
    getMetadata: (userId: string, collection: string) => ({
      method: 'get',
      path: `/metadata/${userId}/${collection}`,
    }),
  },
  clinic: {
    get: (search: string) => ({
      method: 'get',
      path: `/v1/clinics/${search}`,
    }),
    getByShareCode: (search: string) => ({
      method: 'get',
      path: `/v1/clinics/share_code/${search}`,
    }),
  },
};

type apiRequestArgs = {
  path: string;
  method: string;
};

export const apiRequest = async ({ path, method }: apiRequestArgs) => {
  try {
    const result = await fetch(`${process.env.API_HOST}${path}`, {
      method,
      headers: {
        'x-tidepool-session-token': serverAuth.serverSessionToken,
      },
    });

    return await result.json();
  } catch (e) {
    console.error(e);
  }
};

export const apiRequests = async (requests: apiRequestArgs[]) => {
  try {
    const results = await Promise.all(
      requests.map((request) => apiRequest(request)),
    );

    return results;
  } catch (err) {
    console.log(err);
  }
};
