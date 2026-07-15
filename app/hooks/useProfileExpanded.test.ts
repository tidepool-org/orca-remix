import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useProfileExpanded from './useProfileExpanded';

const mockSetProfileExpanded = vi.fn();

vi.mock('~/contexts/ProfileExpandedContext', () => ({
  useProfileExpandedContext: () => ({
    profileExpandedMap: { clinic: true, user: false },
    setProfileExpanded: mockSetProfileExpanded,
  }),
}));

describe('useProfileExpanded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('defaultExpanded', () => {
    it('returns true when profileType is true in the map', () => {
      const { result } = renderHook(() => useProfileExpanded('clinic'));
      expect(result.current.defaultExpanded).toBe(true);
    });

    it('returns false when profileType is false in the map', () => {
      const { result } = renderHook(() => useProfileExpanded('user'));
      expect(result.current.defaultExpanded).toBe(false);
    });

    it('returns false when profileType is not in the map', () => {
      const { result } = renderHook(() => useProfileExpanded('unknown'));
      expect(result.current.defaultExpanded).toBe(false);
    });
  });

  describe('onExpandedChange', () => {
    it('calls setProfileExpanded with the correct profileType and value', () => {
      const { result } = renderHook(() => useProfileExpanded('clinic'));

      act(() => {
        result.current.onExpandedChange(false);
      });

      expect(mockSetProfileExpanded).toHaveBeenCalledWith('clinic', false);
    });

    it('calls setProfileExpanded with expanded: true', () => {
      const { result } = renderHook(() => useProfileExpanded('user'));

      act(() => {
        result.current.onExpandedChange(true);
      });

      expect(mockSetProfileExpanded).toHaveBeenCalledWith('user', true);
    });
  });
});
