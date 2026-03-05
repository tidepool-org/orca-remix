import { useEffect, useRef, useCallback } from 'react';
import type { NavigateFunction } from 'react-router';

type UseKeyboardShortcutsOptions = {
  navigate: NavigateFunction;
  openHelpModal: () => void;
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
          toggleSidebar();
          break;
        case '/':
          e.preventDefault();
          document
            .querySelector<HTMLInputElement>('#header-search input')
            ?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearChord();
    };
  }, [navigate, openHelpModal, clearChord]);
}

function toggleSidebar() {
  const current = localStorage.getItem('sidebar-expanded') === 'true';
  const next = !current;
  localStorage.setItem('sidebar-expanded', next.toString());

  const body = document.querySelector('body') as HTMLElement;
  if (next) {
    body.classList.add('sidebar-expanded');
  } else {
    body.classList.remove('sidebar-expanded');
  }

  window.dispatchEvent(
    new StorageEvent('storage', { key: 'sidebar-expanded' }),
  );
}
