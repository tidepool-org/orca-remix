import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPersistedViewState,
  persistViewState,
  getPersistedParamsString,
} from './viewStatePersistence';

describe('viewStatePersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getPersistedViewState', () => {
    it('returns null when nothing is stored', () => {
      expect(getPersistedViewState('clinic', 'abc123')).toBeNull();
    });

    it('returns the stored state when entity ID matches', () => {
      localStorage.setItem(
        'clinic-viewState',
        JSON.stringify({ entityId: 'abc123', tab: 'patients' }),
      );

      const result = getPersistedViewState('clinic', 'abc123');
      expect(result).toEqual({ entityId: 'abc123', tab: 'patients' });
    });

    it('returns state with params when stored', () => {
      localStorage.setItem(
        'clinic-viewState',
        JSON.stringify({
          entityId: 'abc123',
          tab: 'patients',
          params: { search: 'john', page: '2' },
        }),
      );

      const result = getPersistedViewState('clinic', 'abc123');
      expect(result).toEqual({
        entityId: 'abc123',
        tab: 'patients',
        params: { search: 'john', page: '2' },
      });
    });

    it('returns null and clears storage when entity ID does not match', () => {
      localStorage.setItem(
        'clinic-viewState',
        JSON.stringify({ entityId: 'abc123', tab: 'patients' }),
      );

      const result = getPersistedViewState('clinic', 'different-id');
      expect(result).toBeNull();
      expect(localStorage.getItem('clinic-viewState')).toBeNull();
    });

    it('returns null and clears storage on parse errors', () => {
      localStorage.setItem('clinic-viewState', 'invalid json');

      const result = getPersistedViewState('clinic', 'abc123');
      expect(result).toBeNull();
      expect(localStorage.getItem('clinic-viewState')).toBeNull();
    });

    it('uses entity type as part of the storage key', () => {
      localStorage.setItem(
        'patient-viewState',
        JSON.stringify({ entityId: 'p1', tab: 'data' }),
      );

      expect(getPersistedViewState('clinic', 'p1')).toBeNull();
      expect(getPersistedViewState('patient', 'p1')).toEqual({
        entityId: 'p1',
        tab: 'data',
      });
    });
  });

  describe('persistViewState', () => {
    it('stores tab without params', () => {
      persistViewState('clinic', 'abc123', 'patients');

      const stored = JSON.parse(
        localStorage.getItem('clinic-viewState') as string,
      );
      expect(stored).toEqual({ entityId: 'abc123', tab: 'patients' });
    });

    it('stores tab with params', () => {
      persistViewState('clinic', 'abc123', 'patients', {
        search: 'john',
        page: '2',
      });

      const stored = JSON.parse(
        localStorage.getItem('clinic-viewState') as string,
      );
      expect(stored).toEqual({
        entityId: 'abc123',
        tab: 'patients',
        params: { search: 'john', page: '2' },
      });
    });

    it('omits params when the object is empty', () => {
      persistViewState('clinic', 'abc123', 'patients', {});

      const stored = JSON.parse(
        localStorage.getItem('clinic-viewState') as string,
      );
      expect(stored).toEqual({ entityId: 'abc123', tab: 'patients' });
      expect(stored.params).toBeUndefined();
    });

    it('overwrites previous state for the same entity type', () => {
      persistViewState('clinic', 'abc123', 'clinicians');
      persistViewState('clinic', 'abc123', 'patients');

      const stored = JSON.parse(
        localStorage.getItem('clinic-viewState') as string,
      );
      expect(stored.tab).toBe('patients');
    });

    it('overwrites state when entity ID changes', () => {
      persistViewState('clinic', 'abc123', 'patients');
      persistViewState('clinic', 'xyz789', 'settings');

      const stored = JSON.parse(
        localStorage.getItem('clinic-viewState') as string,
      );
      expect(stored).toEqual({ entityId: 'xyz789', tab: 'settings' });
    });

    it('ignores storage errors gracefully', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceeded');
        });

      expect(() =>
        persistViewState('clinic', 'abc123', 'patients'),
      ).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('getPersistedParamsString', () => {
    it('returns empty string when nothing is stored', () => {
      expect(getPersistedParamsString('clinic', 'abc123')).toBe('');
    });

    it('returns tab-only params string when no extra params are stored', () => {
      persistViewState('clinic', 'abc123', 'patients');

      const result = getPersistedParamsString('clinic', 'abc123');
      expect(result).toBe('tab=patients');
    });

    it('returns tab + extra params string', () => {
      persistViewState('clinic', 'abc123', 'patients', {
        search: 'john',
        page: '2',
      });

      const result = getPersistedParamsString('clinic', 'abc123');
      const params = new URLSearchParams(result);
      expect(params.get('tab')).toBe('patients');
      expect(params.get('search')).toBe('john');
      expect(params.get('page')).toBe('2');
    });

    it('returns empty string when entity ID does not match', () => {
      persistViewState('clinic', 'abc123', 'patients');

      expect(getPersistedParamsString('clinic', 'different-id')).toBe('');
    });
  });
});
