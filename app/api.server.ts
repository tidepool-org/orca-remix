import { serverAuth } from './auth.server';
import { z } from 'zod';
import { APIError } from './utils/errors';

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
    // Account verification
    getSignupKey: (userId: string) => ({
      method: 'get',
      path: `/confirm/signup/${userId}`,
    }),
    confirmSignup: (userId: string, confirmKey: string) => ({
      method: 'put',
      path: `/confirm/accept/signup/${userId}`,
      body: { key: confirmKey },
    }),
    sendConfirmation: (userId: string) => ({
      method: 'post',
      path: `/confirm/send/signup/${userId}`,
    }),
    resendConfirmation: (email: string) => ({
      method: 'post',
      path: `/confirm/resend/signup/${email}`,
    }),
    // Password reset
    sendPasswordReset: (email: string) => ({
      method: 'post',
      path: `/confirm/send/forgot/${email}`,
    }),
    // Destructive actions
    delete: (userId: string) => ({
      method: 'delete',
      path: `/v1/users/${userId}`,
    }),
    deleteData: (userId: string) => ({
      method: 'delete',
      path: `/v1/users/${userId}/data`,
    }),
  },
  data: {
    // ref https://tidepool.redocly.app/reference/data.v1
    getDataSets: (userId: string) => ({
      method: 'get',
      path: `/v1/users/${userId}/datasets`,
    }),
    getDataSources: (userId: string) => ({
      method: 'get',
      path: `/v1/users/${userId}/data_sources`,
    }),
    getData: (
      userId: string,
      options?: {
        type?: string | string[];
        subType?: string | string[];
        startDate?: string;
        endDate?: string;
        latest?: boolean;
        uploadId?: string;
        deviceId?: string;
      },
    ) => {
      const params = new URLSearchParams();
      if (options?.type) {
        const types = Array.isArray(options.type)
          ? options.type.join(',')
          : options.type;
        params.set('type', types);
      }
      if (options?.subType) {
        const subTypes = Array.isArray(options.subType)
          ? options.subType.join(',')
          : options.subType;
        params.set('subType', subTypes);
      }
      if (options?.startDate) params.set('startDate', options.startDate);
      if (options?.endDate) params.set('endDate', options.endDate);
      if (options?.latest) params.set('latest', 'true');
      if (options?.uploadId) params.set('uploadId', options.uploadId);
      if (options?.deviceId) params.set('deviceId', options.deviceId);

      return {
        method: 'get',
        path: `/data/${userId}${params.toString() ? `?${params.toString()}` : ''}`,
      };
    },
    deleteDataSet: (dataSetId: string) => ({
      method: 'delete',
      path: `/v1/datasets/${dataSetId}`,
    }),
    deleteDataFromDataSet: (dataSetId: string) => ({
      method: 'delete',
      path: `/v1/data_sets/${dataSetId}/data`,
    }),
  },
  export: {
    // ref https://tidepool.redocly.app/reference/export.v1
    getData: (
      userId: string,
      options?: {
        startDate?: string;
        endDate?: string;
        format?: 'json' | 'xlsx';
        bgUnits?: 'mmol/L' | 'mg/dL';
      },
    ) => {
      const params = new URLSearchParams();
      if (options?.startDate) params.set('startDate', options.startDate);
      if (options?.endDate) params.set('endDate', options.endDate);
      if (options?.format) params.set('format', options.format);
      if (options?.bgUnits) params.set('bgUnits', options.bgUnits);

      return {
        method: 'get',
        path: `/export/${userId}${params.toString() ? `?${params.toString()}` : ''}`,
      };
    },
  },
  sharing: {
    // ref https://tidepool.redocly.app/reference/access.v1
    // Get groups (accounts) that the user can access (accounts that share WITH user)
    getGroupsForUser: (userId: string) => ({
      method: 'get',
      path: `/access/groups/${userId}`,
    }),
    // Get users who have access to this user's data (accounts user shares WITH)
    getUsersInGroup: (userId: string) => ({
      method: 'get',
      path: `/access/${userId}`,
    }),
  },
  invites: {
    // ref https://tidepool.redocly.app/reference/confirm.v1
    // Get pending invites sent by this user (outbound)
    getSentInvites: (userId: string) => ({
      method: 'get',
      path: `/confirm/invite/${userId}`,
    }),
    // Get pending invites received by this user (inbound)
    getReceivedInvites: (userId: string) => ({
      method: 'get',
      path: `/confirm/invitations/${userId}`,
    }),
  },
  clinic: {
    // ref https://tidepool.redocly.app/reference/clinic.v1
    get: (search: string) => ({
      method: 'get',
      path: `/v1/clinics/${search}`,
    }),
    getByShareCode: (search: string) => ({
      method: 'get',
      path: `/v1/clinics/share_code/${search}`,
    }),
    getPatients: (
      clinicId: string,
      options?: {
        limit?: number;
        offset?: number;
        search?: string;
        sort?: string;
      },
    ) => {
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
        path: `/v1/clinics/${clinicId}/patients${
          params.toString() ? `?${params.toString()}` : ''
        }`,
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
    // Note: There is no API endpoint to list all clinician invites for a clinic
    // GET /v1/clinics/{clinicId}/invites/clinicians only works with a specific {inviteId}
    // Use getClinicianInvite(clinicId, inviteId) to get a specific invite instead
    getClinicianInvite: (clinicId: string, inviteId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/invites/clinicians/${inviteId}`,
    }),
    getClinicians: (
      clinicId: string,
      options?: { limit?: number; offset?: number },
    ) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/clinicians${
        options
          ? `?${new URLSearchParams({
              ...(options.limit && { limit: options.limit.toString() }),
              ...(options.offset && { offset: options.offset.toString() }),
            })}`
          : ''
      }`,
    }),
    getClinician: (clinicId: string, clinicianId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/clinicians/${clinicianId}`,
    }),
    getClinicsForClinician: (
      clinicianId: string,
      options?: { limit?: number; offset?: number },
    ) => ({
      method: 'get',
      path: `/v1/clinicians/${clinicianId}/clinics${
        options
          ? `?${new URLSearchParams({
              ...(options.limit && { limit: options.limit.toString() }),
              ...(options.offset && { offset: options.offset.toString() }),
            })}`
          : ''
      }`,
    }),
    getClinicsForPatient: (
      patientId: string,
      options?: { limit?: number; offset?: number },
    ) => ({
      method: 'get',
      path: `/v1/patients/${patientId}/clinics${
        options
          ? `?${new URLSearchParams({
              ...(options.limit && { limit: options.limit.toString() }),
              ...(options.offset && { offset: options.offset.toString() }),
            })}`
          : ''
      }`,
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

type apiRequestWithSchemaArgs<T> = apiRequestArgs & {
  schema?: z.ZodSchema<T>;
};

export const apiRequest = async <T = unknown>({
  path,
  method,
  body,
  schema,
}: apiRequestWithSchemaArgs<T>): Promise<T> => {
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
      const errorText = await result.text();
      const statusText = result.statusText || 'Request failed';
      const message = errorText
        ? `${statusText} (${result.status}): ${errorText}`
        : `${statusText} (${result.status})`;

      throw new APIError(message, result.status);
    }

    // Try to parse JSON response, but don't fail if it's empty
    const text = await result.text();
    const data = text ? JSON.parse(text) : {};

    // Validate with schema if provided
    if (schema) {
      return schema.parse(data);
    }

    return data as T;
  } catch (e) {
    // Re-throw APIError as-is, don't wrap it
    if (e instanceof APIError) {
      throw e;
    }
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

// Special request function for file exports that returns raw Response
export const apiRequestFile = async ({
  path,
  method,
}: apiRequestArgs): Promise<Response> => {
  const result = await fetch(`${process.env.API_HOST}${path}`, {
    method,
    headers: {
      'x-tidepool-session-token': serverAuth.serverSessionToken,
    },
  });

  if (!result.ok) {
    const errorText = await result.text();
    const statusText = result.statusText || 'Request failed';
    const message = errorText
      ? `${statusText} (${result.status}): ${errorText}`
      : `${statusText} (${result.status})`;

    throw new APIError(message, result.status);
  }

  return result;
};
