import type { ResourceState, ResourceError } from '~/api.types';

type ResourceDataResult<T> = {
  /** The data (either from successful fetch or fallback) */
  data: T;
  /** Whether the fetch resulted in an error */
  hasError: boolean;
  /** Error details if hasError is true */
  error?: ResourceError;
};

/**
 * Hook to extract data from a ResourceState with a fallback value.
 * Simplifies handling of ResourceState in components.
 *
 * @example
 * const { data: prescriptions, hasError, error } = useResourceData(
 *   prescriptionsState,
 *   [] // fallback
 * );
 *
 * if (hasError) {
 *   return <ResourceError title="Prescriptions" message={error?.message} />;
 * }
 *
 * return <PrescriptionsTable prescriptions={prescriptions} />;
 */
export function useResourceData<T>(
  state: ResourceState<T> | undefined,
  fallback: T,
): ResourceDataResult<T> {
  if (!state) {
    return { data: fallback, hasError: false };
  }

  if (state.status === 'error') {
    return { data: fallback, hasError: true, error: state.error };
  }

  return { data: state.data, hasError: false };
}

/**
 * Extracts just the data from a ResourceState, using fallback on error.
 * Use this when you don't need to display error state (backward compatibility).
 */
export function getResourceData<T>(
  state: ResourceState<T> | undefined,
  fallback: T,
): T {
  if (!state || state.status === 'error') {
    return fallback;
  }
  return state.data;
}
