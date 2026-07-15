import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useToast hook', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within ToastProvider');
    });
  });

  describe('ToastProvider', () => {
    describe('Initial State', () => {
      it('initializes with empty toasts array', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        expect(result.current.toasts).toEqual([]);
      });
    });

    describe('showToast', () => {
      it('adds a toast with default type (info)', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Test message');
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].message).toBe('Test message');
        expect(result.current.toasts[0].type).toBe('info');
      });

      it('adds a toast with specified type', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Success!', 'success');
        });

        expect(result.current.toasts[0].type).toBe('success');

        act(() => {
          result.current.showToast('Error!', 'error');
        });

        expect(result.current.toasts[1].type).toBe('error');

        act(() => {
          result.current.showToast('Warning!', 'warning');
        });

        expect(result.current.toasts[2].type).toBe('warning');
      });

      it('generates unique ID for each toast', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Toast 1');
          result.current.showToast('Toast 2');
          result.current.showToast('Toast 3');
        });

        const ids = result.current.toasts.map((t) => t.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(3);
      });

      it('auto-dismisses toast after default duration (5000ms)', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Auto dismiss test');
        });

        expect(result.current.toasts).toHaveLength(1);

        // Advance time by 4999ms - toast should still be there
        act(() => {
          vi.advanceTimersByTime(4999);
        });

        expect(result.current.toasts).toHaveLength(1);

        // Advance time by 1ms more (total 5000ms) - toast should be dismissed
        act(() => {
          vi.advanceTimersByTime(1);
        });

        expect(result.current.toasts).toHaveLength(0);
      });

      it('auto-dismisses toast after custom duration', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Custom duration', 'info', 2000);
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
          vi.advanceTimersByTime(2000);
        });

        expect(result.current.toasts).toHaveLength(0);
      });

      it('does not auto-dismiss when duration is 0', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Persistent toast', 'info', 0);
        });

        expect(result.current.toasts).toHaveLength(1);

        // Advance time significantly
        act(() => {
          vi.advanceTimersByTime(60000);
        });

        // Toast should still be there
        expect(result.current.toasts).toHaveLength(1);
      });

      it('can show multiple toasts simultaneously', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Toast 1', 'success');
          result.current.showToast('Toast 2', 'error');
          result.current.showToast('Toast 3', 'warning');
        });

        expect(result.current.toasts).toHaveLength(3);
        expect(result.current.toasts[0].message).toBe('Toast 1');
        expect(result.current.toasts[1].message).toBe('Toast 2');
        expect(result.current.toasts[2].message).toBe('Toast 3');
      });
    });

    describe('hideToast', () => {
      it('removes a specific toast by ID', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Toast 1', 'info', 0); // Persistent
          result.current.showToast('Toast 2', 'info', 0); // Persistent
          result.current.showToast('Toast 3', 'info', 0); // Persistent
        });

        const toastIdToRemove = result.current.toasts[1].id;

        act(() => {
          result.current.hideToast(toastIdToRemove);
        });

        expect(result.current.toasts).toHaveLength(2);
        expect(
          result.current.toasts.find((t) => t.id === toastIdToRemove),
        ).toBeUndefined();
        expect(result.current.toasts[0].message).toBe('Toast 1');
        expect(result.current.toasts[1].message).toBe('Toast 3');
      });

      it('does nothing when ID does not exist', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Toast 1', 'info', 0);
        });

        const originalLength = result.current.toasts.length;

        act(() => {
          result.current.hideToast('non-existent-id');
        });

        expect(result.current.toasts).toHaveLength(originalLength);
      });
    });

    describe('Auto-dismiss with multiple toasts', () => {
      it('dismisses toasts independently based on their duration', () => {
        const { result } = renderHook(() => useToast(), {
          wrapper: ToastProvider,
        });

        act(() => {
          result.current.showToast('Short toast', 'info', 1000);
          result.current.showToast('Long toast', 'info', 3000);
        });

        expect(result.current.toasts).toHaveLength(2);

        // After 1000ms, short toast should be gone
        act(() => {
          vi.advanceTimersByTime(1000);
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].message).toBe('Long toast');

        // After another 2000ms (total 3000ms), long toast should be gone
        act(() => {
          vi.advanceTimersByTime(2000);
        });

        expect(result.current.toasts).toHaveLength(0);
      });
    });
  });
});
