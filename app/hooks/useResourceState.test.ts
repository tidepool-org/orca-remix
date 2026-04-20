import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResourceData, getResourceData } from './useResourceState';
import type { ResourceState } from '~/api.types';

describe('useResourceState', () => {
  describe('useResourceData', () => {
    describe('with undefined state', () => {
      it('returns fallback data when state is undefined', () => {
        const { result } = renderHook(() =>
          useResourceData(undefined, 'fallback'),
        );

        expect(result.current.data).toBe('fallback');
        expect(result.current.hasError).toBe(false);
        expect(result.current.error).toBeUndefined();
      });

      it('returns empty array fallback when state is undefined', () => {
        const { result } = renderHook(() =>
          useResourceData<string[]>(undefined, []),
        );

        expect(result.current.data).toEqual([]);
        expect(result.current.hasError).toBe(false);
      });
    });

    describe('with success state', () => {
      it('returns data from successful state', () => {
        const state: ResourceState<string> = {
          status: 'success',
          data: 'success data',
        };

        const { result } = renderHook(() => useResourceData(state, 'fallback'));

        expect(result.current.data).toBe('success data');
        expect(result.current.hasError).toBe(false);
        expect(result.current.error).toBeUndefined();
      });

      it('returns array data from successful state', () => {
        const state: ResourceState<string[]> = {
          status: 'success',
          data: ['item1', 'item2'],
        };

        const { result } = renderHook(() => useResourceData(state, []));

        expect(result.current.data).toEqual(['item1', 'item2']);
        expect(result.current.hasError).toBe(false);
      });

      it('returns object data from successful state', () => {
        const state: ResourceState<{ id: string; name: string }> = {
          status: 'success',
          data: { id: '123', name: 'Test' },
        };

        const { result } = renderHook(() =>
          useResourceData(state, { id: '', name: '' }),
        );

        expect(result.current.data).toEqual({ id: '123', name: 'Test' });
        expect(result.current.hasError).toBe(false);
      });
    });

    describe('with error state', () => {
      it('returns fallback and error info when state has error', () => {
        const state: ResourceState<string> = {
          status: 'error',
          error: { message: 'Something went wrong' },
        };

        const { result } = renderHook(() => useResourceData(state, 'fallback'));

        expect(result.current.data).toBe('fallback');
        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toEqual({
          message: 'Something went wrong',
        });
      });

      it('returns error with code when present', () => {
        const state: ResourceState<string[]> = {
          status: 'error',
          error: { message: 'Not found', code: 404 },
        };

        const { result } = renderHook(() => useResourceData(state, []));

        expect(result.current.data).toEqual([]);
        expect(result.current.hasError).toBe(true);
        expect(result.current.error).toEqual({
          message: 'Not found',
          code: 404,
        });
      });

      it('returns empty array fallback on error', () => {
        const state: ResourceState<string[]> = {
          status: 'error',
          error: { message: 'Server error', code: 500 },
        };

        const { result } = renderHook(() => useResourceData(state, []));

        expect(result.current.data).toEqual([]);
        expect(result.current.hasError).toBe(true);
      });
    });
  });

  describe('getResourceData', () => {
    it('returns fallback when state is undefined', () => {
      const result = getResourceData(undefined, 'default');
      expect(result).toBe('default');
    });

    it('returns data when state is successful', () => {
      const state: ResourceState<string> = {
        status: 'success',
        data: 'actual data',
      };

      const result = getResourceData(state, 'default');
      expect(result).toBe('actual data');
    });

    it('returns fallback when state has error', () => {
      const state: ResourceState<string> = {
        status: 'error',
        error: { message: 'Error' },
      };

      const result = getResourceData(state, 'default');
      expect(result).toBe('default');
    });

    it('returns array data from successful state', () => {
      const state: ResourceState<number[]> = {
        status: 'success',
        data: [1, 2, 3],
      };

      const result = getResourceData(state, []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns empty array fallback on error', () => {
      const state: ResourceState<number[]> = {
        status: 'error',
        error: { message: 'Failed to load' },
      };

      const result = getResourceData(state, []);
      expect(result).toEqual([]);
    });

    it('returns complex object from successful state', () => {
      type User = { id: string; name: string; email: string };
      const state: ResourceState<User> = {
        status: 'success',
        data: { id: '1', name: 'John', email: 'john@example.com' },
      };

      const result = getResourceData(state, { id: '', name: '', email: '' });
      expect(result).toEqual({
        id: '1',
        name: 'John',
        email: 'john@example.com',
      });
    });
  });
});
