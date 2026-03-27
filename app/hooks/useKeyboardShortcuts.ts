import { useEffect, useRef, useCallback } from 'react';
import type { NavigateFunction } from 'react-router';

type UseKeyboardShortcutsOptions = {
  navigate: NavigateFunction;
  openHelpModal: () => void;
  toggleSidebar: () => void;
};

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
}

function isModalOpen(): boolean {
  return !!document.querySelector('[role="dialog"]');
}

export default function useKeyboardShortcuts({
  navigate,
  openHelpModal,
  toggleSidebar,
}: UseKeyboardShortcutsOptions) {
  const chordRef = useRef<string | null>(null);
  const chordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChord = useCallback(() => {
    chordRef.current = null;
    if (chordTimeoutRef.current) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;
      if (isModalOpen()) return;

      // Handle chord second key
      if (chordRef.current === 'g') {
        clearChord();
        const chordMap: Record<string, string> = {
          h: '/',
          u: '/users',
          c: '/clinics',
          r: '/reports',
        };
        const route = chordMap[e.key];
        if (route) {
          e.preventDefault();
          navigate(route);
        } else if (e.key === 'b') {
          window.history.back();
        } else if (e.key === 'f') {
          window.history.forward();
        }
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          openHelpModal();
          break;
        case 'g':
          chordRef.current = 'g';
          chordTimeoutRef.current = setTimeout(clearChord, 1000);
          break;
        case 's':
          e.preventDefault();
          toggleSidebar();
          break;
        case '/':
          e.preventDefault();
          document
            .querySelector<HTMLInputElement>('#header-search input')
            ?.focus();
          break;
        case 'h':
        case 'j':
        case 'k':
        case 'l':
          dispatchArrowKey(e);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearChord();
    };
  }, [navigate, openHelpModal, toggleSidebar, clearChord]);
}

const VIM_TO_ARROW: Record<string, string> = {
  h: 'ArrowLeft',
  j: 'ArrowDown',
  k: 'ArrowUp',
  l: 'ArrowRight',
};

function dispatchArrowKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: VIM_TO_ARROW[e.key], bubbles: true }),
  );
}
