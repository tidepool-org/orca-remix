import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import useLocale, { LocaleProvider } from './useLocale';

describe('useLocale', () => {
  describe('default context', () => {
    it('returns default en-US locale when not wrapped in provider', () => {
      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('en-US');
      expect(result.current.direction).toBe('ltr');
    });
  });

  describe('with LocaleProvider', () => {
    it('returns provided locale value', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LocaleProvider locale={{ locale: 'de-DE', direction: 'ltr' }}>
          {children}
        </LocaleProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('de-DE');
      expect(result.current.direction).toBe('ltr');
    });

    it('returns RTL direction for RTL locales', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LocaleProvider locale={{ locale: 'ar-SA', direction: 'rtl' }}>
          {children}
        </LocaleProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('ar-SA');
      expect(result.current.direction).toBe('rtl');
    });

    it('returns French locale when provided', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LocaleProvider locale={{ locale: 'fr-FR', direction: 'ltr' }}>
          {children}
        </LocaleProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('fr-FR');
    });

    it('returns Japanese locale when provided', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <LocaleProvider locale={{ locale: 'ja-JP', direction: 'ltr' }}>
          {children}
        </LocaleProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('ja-JP');
    });
  });

  describe('LocaleProvider', () => {
    it('provides locale to nested components', () => {
      const { result } = renderHook(() => useLocale(), {
        wrapper: ({ children }) => (
          <LocaleProvider locale={{ locale: 'es-ES', direction: 'ltr' }}>
            {children}
          </LocaleProvider>
        ),
      });

      expect(result.current.locale).toBe('es-ES');
    });
  });
});
