import {
  authorizeServer,
  invalidateServerToken,
  serverAuth,
} from './auth.server';
import { z } from 'zod';
import { APIError } from './utils/errors';
import type { ResourceState } from './api.types';

export const apiRoutes = {
  user: {
    get: (search: string) => ({
      method: 'get',
      path: `/auth/user/${encodeURIComponent(search)}`,
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
      path: `/confirm/resend/signup/${encodeURIComponent(email)}`,
    }),
    // Password reset
    sendPasswordReset: (email: string) => ({
      method: 'post',
      path: `/confirm/send/forgot/${encodeURIComponent(email)}`,
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
    // Data source management (disconnect cloud/passive connections)
    disconnectDataSource: (userId: string, providerName: string) => ({
      method: 'delete',
      path: `/v1/users/${userId}/oauth/${providerName}/authorize`,
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
    // Get all associated users (trustors + trustees) with their profiles in one call
    getAssociatedUsersDetails: (userId: string) => ({
      method: 'get',
      path: `/metadata/users/${userId}/users`,
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
      path: `/v1/clinics/${encodeURIComponent(search)}`,
    }),
    getByShareCode: (search: string) => ({
      method: 'get',
      path: `/v1/clinics/share_code/${encodeURIComponent(search)}`,
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
      if (options?.limit != null) params.set('limit', options.limit.toString());
      if (options?.offset != null)
        params.set('offset', options.offset.toString());
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
    updatePatient: (clinicId: string, patientId: string) => ({
      method: 'put',
      path: `/v1/clinics/${clinicId}/patients/${patientId}`,
    }),
    getPatientInvites: (clinicId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/invites/patients`,
    }),
    // Note: Clinician invites are returned in the getClinicians endpoint response.
    // Records with 'inviteId' (no 'id') are pending invites; records with 'id' are accepted clinicians.
    // Use getClinicianInvite to get a specific invite by its ID.
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
              ...(options.limit != null && { limit: options.limit.toString() }),
              ...(options.offset != null && {
                offset: options.offset.toString(),
              }),
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
              ...(options.limit != null && { limit: options.limit.toString() }),
              ...(options.offset != null && {
                offset: options.offset.toString(),
              }),
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
              ...(options.limit != null && { limit: options.limit.toString() }),
              ...(options.offset != null && {
                offset: options.offset.toString(),
              }),
            })}`
          : ''
      }`,
    }),
    updateTier: (clinicId: string) => ({
      method: 'post',
      path: `/v1/clinics/${clinicId}/tier`,
    }),
    // Update clinic - update timezone and other clinic properties
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/updateclinic
    update: (clinicId: string) => ({
      method: 'put',
      path: `/v1/clinics/${clinicId}`,
    }),
    // Delete clinic workspace
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/deleteclinic
    delete: (clinicId: string) => ({
      method: 'delete',
      path: `/v1/clinics/${clinicId}`,
    }),
    // MRN settings
    // ref https://tidepool.redocly.app/reference/clinic.v1/internal/getmrnsettings
    getMrnSettings: (clinicId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/settings/mrn`,
    }),
    // ref https://tidepool.redocly.app/reference/clinic.v1/internal/updatemrnsettings
    updateMrnSettings: (clinicId: string) => ({
      method: 'put',
      path: `/v1/clinics/${clinicId}/settings/mrn`,
    }),
    // Patient count settings
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/getpatientcountsettings
    getPatientCountSettings: (clinicId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/settings/patient_count`,
    }),
    // ref https://tidepool.redocly.app/reference/clinic.v1/internal/updatepatientcountsettings
    updatePatientCountSettings: (clinicId: string) => ({
      method: 'put',
      path: `/v1/clinics/${clinicId}/settings/patient_count`,
    }),
    // Merge clinic - merges tags, patients, clinicians, invites and share codes from source clinic
    mergeClinic: (targetClinicId: string, sourceClinicId: string) => ({
      method: 'post',
      path: `/v1/clinics/${targetClinicId}/merge`,
      body: { sourceId: sourceClinicId },
    }),
    // Generate merge report (xlsx) for merging source clinic into target clinic
    generateMergeReport: (targetClinicId: string, sourceClinicId: string) => ({
      method: 'post',
      path: `/v1/clinics/${targetClinicId}/reports/merge`,
      body: { sourceId: sourceClinicId },
    }),
    // Delete clinician invitation
    // ref https://tidepool.redocly.app/reference/clinic.v1/confirmations/deleteclinicianinvite
    deleteClinicianInvite: (clinicId: string, inviteId: string) => ({
      method: 'delete',
      path: `/v1/clinics/${clinicId}/invites/clinicians/${inviteId}`,
    }),
    // Remove clinician from clinic
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/deleteclinician
    deleteClinician: (clinicId: string, clinicianId: string) => ({
      method: 'delete',
      path: `/v1/clinics/${clinicId}/clinicians/${clinicianId}`,
    }),
    // Update clinician roles
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/updateclinician
    updateClinician: (clinicId: string, clinicianId: string) => ({
      method: 'put',
      path: `/v1/clinics/${clinicId}/clinicians/${clinicianId}`,
    }),
    // Delete patient invitation
    // ref https://tidepool.redocly.app/reference/clinic.v1/confirmations/deletepatientinvitation
    deletePatientInvite: (clinicId: string, inviteId: string) => ({
      method: 'delete',
      path: `/v1/clinics/${clinicId}/invites/patients/${inviteId}`,
    }),
    // Send a connect request for a data provider to a patient
    // ref https://tidepool.redocly.app/reference/clinic.v1/clinics/sendpatientdataproviderconnectrequest
    sendConnectRequest: (
      clinicId: string,
      patientId: string,
      providerName: string,
    ) => ({
      method: 'post',
      path: `/v1/clinics/${clinicId}/patients/${patientId}/connect/${providerName}`,
    }),
  },
  prescription: {
    // ref https://tidepool.redocly.app/reference/prescription.v1
    // Get all prescriptions for a clinic
    getClinicPrescriptions: (
      clinicId: string,
      options?: {
        patientUserId?: string;
        patientEmail?: string;
        state?: string;
        createdAfter?: string;
        createdBefore?: string;
      },
    ) => {
      const params = new URLSearchParams();
      if (options?.patientUserId)
        params.set('patientUserId', options.patientUserId);
      if (options?.patientEmail)
        params.set('patientEmail', options.patientEmail);
      if (options?.state) params.set('state', options.state);
      if (options?.createdAfter)
        params.set('createdAfter', options.createdAfter);
      if (options?.createdBefore)
        params.set('createdBefore', options.createdBefore);

      return {
        method: 'get',
        path: `/v1/clinics/${clinicId}/prescriptions${params.toString() ? `?${params.toString()}` : ''}`,
      };
    },
    // Get a single prescription by ID
    getPrescription: (clinicId: string, prescriptionId: string) => ({
      method: 'get',
      path: `/v1/clinics/${clinicId}/prescriptions/${prescriptionId}`,
    }),
    // Get all prescriptions for a patient/user
    getPatientPrescriptions: (userId: string) => ({
      method: 'get',
      path: `/v1/patients/${userId}/prescriptions`,
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
  const execute = async (): Promise<T> => {
    const result = await fetch(`${serverAuth.apiHost}${path}`, {
      method,
      headers: {
        'x-tidepool-session-token': serverAuth.serverSessionToken,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
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
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        throw new APIError(
          `Invalid JSON response from ${path}: ${preview}`,
          result.status,
        );
      }
    }

    // Validate with schema if provided
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new APIError(`Schema validation failed for ${path}: ${issues}`);
      }
      return result.data;
    }

    return data as T;
  };

  try {
    return await execute();
  } catch (e) {
    let failure: unknown = e;

    // On 401, re-authenticate once and retry the request
    if (e instanceof APIError && e.status === 401) {
      invalidateServerToken();
      await authorizeServer();
      try {
        return await execute();
      } catch (retryError) {
        failure = retryError;
      }
    }

    let error: APIError;
    // Surface timeout as a descriptive APIError
    if (failure instanceof DOMException && failure.name === 'TimeoutError') {
      error = new APIError(`Request to ${path} timed out after 30s`, 504);
    } else if (failure instanceof APIError) {
      // Wrap unknown errors in APIError for consistent error typing
      error = failure;
    } else {
      error = new APIError(
        failure instanceof Error
          ? failure.message
          : `Unknown error requesting ${path}`,
      );
    }

    // Log mutating failures for server-side debugging, since every
    // destructive admin action uses this throwing variant and would otherwise
    // leave no server-side trace. GETs are excluded to keep the noise down.
    // The path is redacted and the backend message omitted because both can
    // carry PII/PHI — same treatment as apiRequestSafe below.
    if (method.toLowerCase() !== 'get') {
      console.error(
        `API request failed: ${method.toUpperCase()} ${redactPath(path)}`,
        { code: error.status },
      );
    }

    // Outside production, log the request unredacted so a failing call can be
    // replayed verbatim against the API. The redacted line above cannot
    // distinguish a routing failure from a bad identifier, which is exactly
    // what a 404 needs. Guarded so identifiers can never reach a deployed log.
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[dev] unredacted: ${method.toUpperCase()} ${serverAuth.apiHost}${path}`,
        { status: error.status, message: error.message },
      );
    }

    throw error;
  }
};

export const apiRequests = async (requests: apiRequestArgs[]) => {
  const results = await Promise.all(
    requests.map((request) => apiRequest(request)),
  );

  return results;
};

// Special request function for file exports that returns raw Response
export const apiRequestFile = async ({
  path,
  method,
  body,
}: apiRequestArgs): Promise<Response> => {
  try {
    const result = await fetch(`${serverAuth.apiHost}${path}`, {
      method,
      headers: {
        'x-tidepool-session-token': serverAuth.serverSessionToken,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
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
  } catch (e) {
    if (e instanceof APIError) throw e;
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new APIError(`File request to ${path} timed out after 30s`, 504);
    }
    throw new APIError(
      `File request to ${path} failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
    );
  }
};

/**
 * Redact PII/PHI from an API path before logging.
 *
 * Several routes embed concrete emails and user/patient/clinic identifiers
 * directly in the path (e.g. `/auth/user/{email}`,
 * `/v1/clinics/{id}/patients/{id}`). Emitting the raw path to server logs
 * would leak that data, so query strings are dropped and identifier-looking
 * segments are replaced with placeholders, leaving the route template intact
 * for debugging.
 */
const redactPath = (path: string): string => {
  const [pathname] = path.split('?');
  return pathname
    .split('/')
    .map((segment) => {
      if (!segment) return segment;
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        // Malformed encoding — fall back to the raw segment.
      }
      if (decoded.includes('@')) return ':email';
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          decoded,
        );
      const isHexId = /^[0-9a-f]{8,}$/i.test(decoded);
      const isNumericId = /^\d+$/.test(decoded);
      // Mixed-case tokens containing a digit (Tidepool share codes, opaque
      // ids). Route keywords are letters-only, so they're left untouched.
      const isMixedToken =
        decoded.length >= 6 &&
        /\d/.test(decoded) &&
        /^[A-Za-z0-9._-]+$/.test(decoded);
      if (isUuid || isHexId || isNumericId || isMixedToken) return ':id';
      return segment;
    })
    .join('/');
};

/**
 * Wraps an API request and returns a ResourceState instead of throwing.
 * Use this for non-critical data fetches where you want to show an inline
 * error state rather than failing the entire page.
 *
 * @example
 * const prescriptions = await apiRequestSafe<Prescription[]>(
 *   apiRoutes.prescription.getClinicPrescriptions(clinicId)
 * );
 * // prescriptions is ResourceState<Prescription[]>
 * // Either { status: 'success', data: [...] }
 * // Or { status: 'error', error: { message: '...', code: 403 } }
 */
export const apiRequestSafe = async <T = unknown>(
  request: apiRequestArgs,
): Promise<ResourceState<T>> => {
  try {
    const data = await apiRequest<T>(request);
    return { status: 'success', data };
  } catch (err) {
    const message =
      err instanceof APIError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'An unknown error occurred';
    const code = err instanceof APIError ? err.status : undefined;

    // Log to console for server-side debugging. The path is redacted and the
    // raw backend message is intentionally omitted, since both can carry
    // PII/PHI (concrete emails/ids in the path; echoed response body in the
    // message). The unredacted message is still returned to the caller below
    // for UI-level handling.
    // Use warn for auth errors (403) since they're expected for optional data fetches
    if (code === 403) {
      console.warn(`API request not authorized: ${redactPath(request.path)}`);
    } else {
      console.error(`API request failed: ${redactPath(request.path)}`, {
        code,
      });
    }

    return {
      status: 'error',
      error: { message, code },
    };
  }
};
