import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedTab } from './usePersistedTab';
import {
  persistViewState,
  getPersistedViewState,
} from '~/utils/viewStatePersistence';

// Mock setSearchParams to track calls
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

describe('usePersistedTab', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSearchParams = new URLSearchParams();
    mockSetSearchParams.mockClear();
  });

  describe('Tab Resolution', () => {
    it('returns defaultTab when no URL tab and no persisted state', () => {
      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      expect(result.current.currentTab).toBe('clinicians');
    });

    it('prefers URL tab over persisted state', () => {
      mockSearchParams = new URLSearchParams('tab=settings');
      persistViewState('clinic', 'abc123', 'patients');

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      expect(result.current.currentTab).toBe('settings');
    });

    it('falls back to persisted tab when URL tab is missing', () => {
      persistViewState('clinic', 'abc123', 'patients');

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      expect(result.current.currentTab).toBe('patients');
    });

    it('ignores persisted state for different entity ID', () => {
      persistViewState('clinic', 'other-id', 'patients');

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      expect(result.current.currentTab).toBe('clinicians');
    });

    it('returns defaultTab when entityId is undefined', () => {
      const { result } = renderHook(() =>
        usePersistedTab('patient', undefined, 'data'),
      );

      expect(result.current.currentTab).toBe('data');
    });
  });

  describe('URL Sync on Mount', () => {
    it('calls setSearchParams to add tab when missing from URL', () => {
      renderHook(() => usePersistedTab('clinic', 'abc123', 'clinicians'));

      expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), {
        replace: true,
        preventScrollReset: true,
      });
    });

    it('does not call setSearchParams when tab is already in URL', () => {
      mockSearchParams = new URLSearchParams('tab=settings');

      renderHook(() => usePersistedTab('clinic', 'abc123', 'clinicians'));

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('does not call setSearchParams when entityId is undefined', () => {
      renderHook(() => usePersistedTab('patient', undefined, 'data'));

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('restores persisted params to URL on mount', () => {
      persistViewState('clinic', 'abc123', 'patients', {
        search: 'john',
        page: '2',
      });

      renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          paramKeys: ['search', 'page'],
        }),
      );

      expect(mockSetSearchParams).toHaveBeenCalled();

      // Simulate the updater function to verify params are set
      const updater = mockSetSearchParams.mock.calls[0][0];
      const params = new URLSearchParams();
      updater(params);
      expect(params.get('tab')).toBe('patients');
      expect(params.get('search')).toBe('john');
      expect(params.get('page')).toBe('2');
    });
  });

  describe('handleTabChange', () => {
    it('persists the new tab to localStorage', () => {
      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      act(() => {
        result.current.handleTabChange('patients');
      });

      const stored = getPersistedViewState('clinic', 'abc123');
      expect(stored?.tab).toBe('patients');
    });

    it('calls setSearchParams with the new tab', () => {
      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians'),
      );

      // Clear mount call
      mockSetSearchParams.mockClear();

      act(() => {
        result.current.handleTabChange('patients');
      });

      expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function), {
        replace: true,
        preventScrollReset: true,
      });

      // Verify the updater sets the tab
      const updater = mockSetSearchParams.mock.calls[0][0];
      const params = new URLSearchParams();
      updater(params);
      expect(params.get('tab')).toBe('patients');
    });

    it('does nothing when entityId is undefined', () => {
      const { result } = renderHook(() =>
        usePersistedTab('patient', undefined, 'data'),
      );

      mockSetSearchParams.mockClear();

      act(() => {
        result.current.handleTabChange('device');
      });

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('persists tracked params alongside tab', () => {
      mockSearchParams = new URLSearchParams(
        'tab=clinicians&search=john&page=2',
      );

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          paramKeys: ['search', 'page'],
        }),
      );

      act(() => {
        result.current.handleTabChange('patients');
      });

      const stored = getPersistedViewState('clinic', 'abc123');
      expect(stored?.tab).toBe('patients');
      expect(stored?.params).toEqual({ search: 'john', page: '2' });
    });
  });

  describe('Auto-persist Params', () => {
    it('persists tracked params when searchParams change', () => {
      mockSearchParams = new URLSearchParams('tab=patients&search=john');

      renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          paramKeys: ['search', 'page'],
        }),
      );

      const stored = getPersistedViewState('clinic', 'abc123');
      expect(stored?.tab).toBe('patients');
      expect(stored?.params).toEqual({ search: 'john' });
    });

    it('does not persist when paramKeys is empty', () => {
      mockSearchParams = new URLSearchParams('tab=patients&search=john');

      renderHook(() => usePersistedTab('clinic', 'abc123', 'clinicians'));

      // Should only have the mount sync, not a param persist
      const stored = getPersistedViewState('clinic', 'abc123');
      // No auto-persist when no paramKeys
      expect(stored).toBeNull();
    });
  });

  describe('enabled option', () => {
    it('does not restore tab to URL on mount when enabled is false', () => {
      persistViewState('clinic', 'abc123', 'patients', { search: 'john' });

      renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          enabled: false,
        }),
      );

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('does not auto-persist params when enabled is false', () => {
      persistViewState('clinic', 'abc123', 'patients', { search: 'john' });
      mockSearchParams = new URLSearchParams('tab=device');

      renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          paramKeys: ['search', 'page'],
          enabled: false,
        }),
      );

      // The stored state should still have the original values, not overwritten
      const stored = getPersistedViewState('clinic', 'abc123');
      expect(stored?.tab).toBe('patients');
      expect(stored?.params).toEqual({ search: 'john' });
    });

    it('does not persist on handleTabChange when enabled is false', () => {
      persistViewState('clinic', 'abc123', 'patients', { search: 'john' });

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          enabled: false,
        }),
      );

      act(() => {
        result.current.handleTabChange('settings');
      });

      // The stored state should still have the original values
      const stored = getPersistedViewState('clinic', 'abc123');
      expect(stored?.tab).toBe('patients');
      expect(stored?.params).toEqual({ search: 'john' });
      // setSearchParams should not have been called (not even for mount)
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('still resolves currentTab from persisted state when enabled is false', () => {
      persistViewState('clinic', 'abc123', 'patients');

      const { result } = renderHook(() =>
        usePersistedTab('clinic', 'abc123', 'clinicians', {
          enabled: false,
        }),
      );

      // Tab resolution is read-only and always works
      expect(result.current.currentTab).toBe('patients');
    });
  });
});
