import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

import {
  getPersistedViewState,
  persistViewState,
} from '~/utils/viewStatePersistence';

type UsePersistedTabOptions = {
  /** Search param keys to persist alongside the tab (e.g., search, page, limit, sort) */
  paramKeys?: string[];
  /** Whether the hook should actively persist and restore state. Defaults to true.
   *  Set to false when a parent route is rendering a child (nested) route,
   *  so the parent's hook doesn't overwrite its persisted state with the child's search params. */
  enabled?: boolean;
};

type UsePersistedTabResult = {
  currentTab: string;
  handleTabChange: (key: React.Key) => void;
};

/**
 * Hook that manages tab state with URL sync and localStorage persistence.
 *
 * - Resolves the active tab from: URL ?tab= > localStorage > defaultTab
 * - On mount, restores persisted tab and params to the URL if missing
 * - On tab change, updates both localStorage and the URL
 * - Auto-persists tracked search params (paramKeys) to localStorage on change
 * - Uses setSearchParams (not submit) so tab-only changes skip loader revalidation
 */
export function usePersistedTab(
  entityType: string,
  entityId: string | undefined,
  defaultTab: string,
  options?: UsePersistedTabOptions,
): UsePersistedTabResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const { paramKeys = [], enabled = true } = options ?? {};
  const initialized = useRef(false);

  // Resolve current tab: URL > localStorage > default
  const urlTab = searchParams.get('tab');
  const persistedState =
    entityId != null ? getPersistedViewState(entityType, entityId) : null;
  const currentTab = urlTab || persistedState?.tab || defaultTab;

  // On mount: restore tab and persisted params to URL if tab is missing
  useEffect(() => {
    if (!enabled || initialized.current || entityId == null) return;
    initialized.current = true;

    if (!searchParams.has('tab')) {
      setSearchParams(
        (prev) => {
          prev.set('tab', currentTab);

          // Restore persisted params that aren't already in the URL
          if (persistedState?.params) {
            for (const [key, value] of Object.entries(persistedState.params)) {
              if (!prev.has(key)) {
                prev.set(key, value);
              }
            }
          }

          return prev;
        },
        { replace: true, preventScrollReset: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, enabled]);

  // Auto-persist tracked params whenever they change
  useEffect(() => {
    if (!enabled || entityId == null || paramKeys.length === 0) return;

    const trackedParams: Record<string, string> = {};
    for (const key of paramKeys) {
      const value = searchParams.get(key);
      if (value != null) {
        trackedParams[key] = value;
      }
    }

    const tab = searchParams.get('tab') || currentTab;
    persistViewState(entityType, entityId, tab, trackedParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, entityType, entityId, searchParams]);

  // Handle tab changes: persist + update URL
  const handleTabChange = useCallback(
    (key: React.Key) => {
      if (!enabled || entityId == null) return;

      const newTab = key.toString();

      // Collect current tracked params for persistence
      const trackedParams: Record<string, string> = {};
      for (const paramKey of paramKeys) {
        const value = searchParams.get(paramKey);
        if (value != null) {
          trackedParams[paramKey] = value;
        }
      }

      persistViewState(entityType, entityId, newTab, trackedParams);

      setSearchParams(
        (prev) => {
          prev.set('tab', newTab);
          return prev;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [enabled, entityType, entityId, paramKeys, searchParams, setSearchParams],
  );

  return { currentTab, handleTabChange };
}
