import type {
  Clinic,
  Patient,
  PatientInvite,
  Clinician,
} from './components/Clinic/types';
import type { User, Profile } from './components/User/types';

// API response wrappers
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    count: number;
    offset?: number;
    limit?: number;
  };
};

// Specific API response types
export type GetClinicsForClinicianResponse = Array<{
  clinic: Clinic;
  clinician: {
    id: string;
    roles: string[];
  };
}>;

export type GetPatientsResponse = PaginatedResponse<Patient>;
export type GetCliniciansResponse = PaginatedResponse<Clinician>;
export type GetPatientInvitesResponse = PatientInvite[];
export type GetClinicResponse = Clinic;
export type GetPatientResponse = Patient;
export type GetClinicianResponse = Clinician;
export type GetUserResponse = User;
export type GetProfileResponse = Profile;

// API request body types
export type UpdateTierBody = {
  tier: string;
};

// Resource state types for handling async data with error states
export type ResourceError = {
  message: string;
  code?: number;
};

export type ResourceState<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: ResourceError };

// Type guard helpers for ResourceState
export function isResourceSuccess<T>(
  state: ResourceState<T>,
): state is { status: 'success'; data: T } {
  return state.status === 'success';
}

export function isResourceError<T>(
  state: ResourceState<T>,
): state is { status: 'error'; error: ResourceError } {
  return state.status === 'error';
}
