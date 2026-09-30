import { useCallback } from 'react';
import { useSearchParams, useSubmit } from 'react-router';

/**
 * Search param values to write. A nullish or empty value drops the key instead
 * of writing it, so a cleared search leaves no `?key=` behind.
 */
export type SearchParamUpdates = Record<
  string,
  string | number | null | undefined
>;

/**
 * Update loader-driving search params, preserving the ones not named.
 *
 * Submits rather than calling `setSearchParams`, because these params are read
 * by loaders — a `setSearchParams` change skips revalidation and would leave
 * the page rendering data that no longer matches its URL.
 *
 * Several keys can move together, which is how a filter change resets paging:
 *
 *     const updateSearchParams = useSearchParamUpdate();
 *     updateSearchParams({ patientsSearch: search, patientsPage: 1 });
 */
export function useSearchParamUpdate() {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  return useCallback(
    (updates: SearchParamUpdates) => {
      const newSearchParams = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      submit(newSearchParams, { method: 'GET', replace: true });
    },
    [searchParams, submit],
  );
}
