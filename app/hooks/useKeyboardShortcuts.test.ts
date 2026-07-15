import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '~/test-utils';
import useKeyboardShortcuts from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockNavigate = vi.fn();
  const mockOpenHelpModal = vi.fn();
  const mockToggleSidebar = vi.fn();

  const defaultOptions = {
    navigate: mockNavigate,
    openHelpModal: mockOpenHelpModal,
    toggleSidebar: mockToggleSidebar,
  };

  function pressKey(key: string, target?: EventTarget) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    if (target) {
      target.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Single-key shortcuts', () => {
    it('opens help modal on "?"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('?');
      expect(mockOpenHelpModal).toHaveBeenCalledTimes(1);
    });

    it('toggles sidebar on "s"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('s');
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('focuses search input on "/"', () => {
      const input = document.createElement('input');
      const container = document.createElement('div');
      container.id = 'header-search';
      container.appendChild(input);
      document.body.appendChild(container);
      const focusSpy = vi.spyOn(input, 'focus');

      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('/');

      expect(focusSpy).toHaveBeenCalled();
      document.body.removeChild(container);
    });
  });

  describe('Chord navigation (g + key)', () => {
    it('navigates to home on "g h"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      pressKey('h');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates to users on "g u"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      pressKey('u');
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });

    it('navigates to clinics on "g c"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      pressKey('c');
      expect(mockNavigate).toHaveBeenCalledWith('/clinics');
    });

    it('navigates to reports on "g r"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      pressKey('r');
      expect(mockNavigate).toHaveBeenCalledWith('/reports');
    });

    it('does not navigate on unknown chord second key', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      pressKey('x');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('clears chord after timeout (1000ms)', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('g');
      vi.advanceTimersByTime(1000);
      pressKey('h');
      // After timeout, 'h' is a vim key, not a chord second key
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Suppression in editable elements', () => {
    it('ignores shortcuts when focused on an input', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      const input = document.createElement('input');
      document.body.appendChild(input);

      pressKey('?', input);
      expect(mockOpenHelpModal).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('ignores shortcuts when focused on a textarea', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      pressKey('s', textarea);
      expect(mockToggleSidebar).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('ignores shortcuts when focused on a contentEditable element', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      pressKey('?', div);
      expect(mockOpenHelpModal).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });
  });

  describe('Suppression when modal is open', () => {
    it('ignores shortcuts when a dialog is open', () => {
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      document.body.appendChild(dialog);

      renderHook(() => useKeyboardShortcuts(defaultOptions));
      pressKey('?');
      expect(mockOpenHelpModal).not.toHaveBeenCalled();

      document.body.removeChild(dialog);
    });
  });

  describe('Vim arrow key mapping', () => {
    it('dispatches ArrowDown for "j"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      const dispatched: string[] = [];
      document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) dispatched.push(e.key);
      });
      pressKey('j');
      expect(dispatched).toContain('ArrowDown');
    });

    it('dispatches ArrowUp for "k"', () => {
      renderHook(() => useKeyboardShortcuts(defaultOptions));
      const dispatched: string[] = [];
      document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) dispatched.push(e.key);
      });
      pressKey('k');
      expect(dispatched).toContain('ArrowUp');
    });
  });
});
