export type PersistedViewState = {
  entityId: string;
  tab: string;
  params?: Record<string, string>;
};

/**
 * Get the persisted view state for an entity from localStorage.
 * Returns the stored state only if the entity ID matches, otherwise clears it and returns null.
 */
export function getPersistedViewState(
  entityType: string,
  entityId: string,
): PersistedViewState | null {
  if (typeof window === 'undefined') return null;

  const storageKey = `${entityType}-viewState`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const data: PersistedViewState = JSON.parse(stored);
    if (data.entityId === entityId) {
      return data;
    } else {
      localStorage.removeItem(storageKey);
      return null;
    }
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

/**
 * Save the current view state for an entity to localStorage.
 */
export function persistViewState(
  entityType: string,
  entityId: string,
  tab: string,
  params?: Record<string, string>,
): void {
  if (typeof window === 'undefined') return;

  const storageKey = `${entityType}-viewState`;
  try {
    const data: PersistedViewState = { entityId, tab };
    if (params && Object.keys(params).length > 0) {
      data.params = params;
    }
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Build a URL with persisted view state params for breadcrumb navigation.
 * Returns the params string (without leading '?') or empty string if no state.
 */
export function getPersistedParamsString(
  entityType: string,
  entityId: string,
): string {
  const state = getPersistedViewState(entityType, entityId);
  if (!state) return '';

  const params = new URLSearchParams();
  params.set('tab', state.tab);

  if (state.params) {
    for (const [key, value] of Object.entries(state.params)) {
      params.set(key, value);
    }
  }

  return params.toString();
}
