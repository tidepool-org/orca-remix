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
    getPatients: (clinicId: string, options?: {
      limit?: number;
      offset?: number;
      search?: string;
      sort?: string;
    }) => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.offset) params.set('offset', options.offset.toString());
      if (options?.search) params.set('search', options.search);

      if (options?.sort) {
        params.set('sort', options.sort);
        params.set('sortType', 'cgm');
      }

      return {
        method: 'get',
        path: `/v1/clinics/${clinicId}/patients${params.toString() ? `?${params.toString()}` : ''}`,
      };
    },
    getPatient: (clinicId: string, patientId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/patients/${patientId}`,
    }),
    getPatientInvites: (clinicId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/invites/patients`,
    }),
    getClinicians: (clinicId: string, options?: { limit?: number; offset?: number }) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/clinicians${options ? `?${new URLSearchParams({
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.offset && { offset: options.offset.toString() }),
      })}` : ''}`,
    }),
    getClinician: (clinicId: string, clinicianId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/clinicians/${clinicianId}`,
    }),
    updateTier: (clinicId: string) => ({
      method: 'post',
      path: `/v1/clinics/${clinicId}/tier`,
    }),
  },
};

type apiRequestArgs = {
  path: string;
  method: string;
  body?: Record<string, unknown>;
};

export const apiRequest = async ({ path, method, body }: apiRequestArgs) => {
  try {
    const result = await fetch(`${process.env.API_HOST}${path}`, {
      method,
      headers: {
        'x-tidepool-session-token': serverAuth.serverSessionToken,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!result.ok) {
      throw new Error(`API request failed with status ${result.status}`);
    }

    // Try to parse JSON response, but don't fail if it's empty
    const text = await result.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error(e);
    throw e;
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
