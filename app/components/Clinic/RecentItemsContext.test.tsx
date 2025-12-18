import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecentItemsProvider, useRecentItems } from './RecentItemsContext';
import type { RecentPatient, RecentClinician } from './types';

const createMockPatient = (id: string): RecentPatient => ({
  id,
  fullName: `Patient ${id}`,
  email: `patient${id}@example.com`,
});

const createMockClinician = (id: string): RecentClinician => ({
  id,
  name: `Clinician ${id}`,
  email: `clinician${id}@example.com`,
  roles: ['CLINIC_MEMBER'],
  lastViewedAt: new Date().toISOString(),
});

describe('RecentItemsContext', () => {
  describe('useRecentItems hook', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useRecentItems());
      }).toThrow('useRecentItems must be used within a RecentItemsProvider');
    });
  });

  describe('RecentItemsProvider', () => {
    describe('Initial State', () => {
      it('initializes with empty arrays by default', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        expect(result.current.recentPatients).toEqual([]);
        expect(result.current.recentClinicians).toEqual([]);
      });

      it('initializes with provided initial patients', () => {
        const initialPatients = [
          createMockPatient('1'),
          createMockPatient('2'),
        ];

        const { result } = renderHook(() => useRecentItems(), {
          wrapper: ({ children }) => (
            <RecentItemsProvider initialPatients={initialPatients}>
              {children}
            </RecentItemsProvider>
          ),
        });

        expect(result.current.recentPatients).toEqual(initialPatients);
      });

      it('initializes with provided initial clinicians', () => {
        const initialClinicians = [
          createMockClinician('1'),
          createMockClinician('2'),
        ];

        const { result } = renderHook(() => useRecentItems(), {
          wrapper: ({ children }) => (
            <RecentItemsProvider initialClinicians={initialClinicians}>
              {children}
            </RecentItemsProvider>
          ),
        });

        expect(result.current.recentClinicians).toEqual(initialClinicians);
      });
    });

    describe('addRecentPatient', () => {
      it('adds a patient to the beginning of the list', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        act(() => {
          result.current.addRecentPatient(createMockPatient('1'));
        });

        expect(result.current.recentPatients).toHaveLength(1);
        expect(result.current.recentPatients[0].id).toBe('1');

        act(() => {
          result.current.addRecentPatient(createMockPatient('2'));
        });

        expect(result.current.recentPatients).toHaveLength(2);
        expect(result.current.recentPatients[0].id).toBe('2');
        expect(result.current.recentPatients[1].id).toBe('1');
      });

      it('moves existing patient to beginning when re-added', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        act(() => {
          result.current.addRecentPatient(createMockPatient('1'));
          result.current.addRecentPatient(createMockPatient('2'));
          result.current.addRecentPatient(createMockPatient('3'));
        });

        expect(result.current.recentPatients.map((p) => p.id)).toEqual([
          '3',
          '2',
          '1',
        ]);

        // Re-add patient 1
        act(() => {
          result.current.addRecentPatient(createMockPatient('1'));
        });

        expect(result.current.recentPatients).toHaveLength(3);
        expect(result.current.recentPatients.map((p) => p.id)).toEqual([
          '1',
          '3',
          '2',
        ]);
      });

      it('limits to 10 patients maximum', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        // Add 12 patients
        act(() => {
          for (let i = 1; i <= 12; i++) {
            result.current.addRecentPatient(createMockPatient(String(i)));
          }
        });

        expect(result.current.recentPatients).toHaveLength(10);
        // Most recent should be first
        expect(result.current.recentPatients[0].id).toBe('12');
        // Oldest (beyond 10) should be dropped
        expect(
          result.current.recentPatients.find((p) => p.id === '1'),
        ).toBeUndefined();
        expect(
          result.current.recentPatients.find((p) => p.id === '2'),
        ).toBeUndefined();
      });
    });

    describe('addRecentClinician', () => {
      it('adds a clinician to the beginning of the list', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        act(() => {
          result.current.addRecentClinician(createMockClinician('1'));
        });

        expect(result.current.recentClinicians).toHaveLength(1);
        expect(result.current.recentClinicians[0].id).toBe('1');

        act(() => {
          result.current.addRecentClinician(createMockClinician('2'));
        });

        expect(result.current.recentClinicians).toHaveLength(2);
        expect(result.current.recentClinicians[0].id).toBe('2');
        expect(result.current.recentClinicians[1].id).toBe('1');
      });

      it('moves existing clinician to beginning when re-added', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        act(() => {
          result.current.addRecentClinician(createMockClinician('1'));
          result.current.addRecentClinician(createMockClinician('2'));
          result.current.addRecentClinician(createMockClinician('3'));
        });

        // Re-add clinician 1
        act(() => {
          result.current.addRecentClinician(createMockClinician('1'));
        });

        expect(result.current.recentClinicians).toHaveLength(3);
        expect(result.current.recentClinicians.map((c) => c.id)).toEqual([
          '1',
          '3',
          '2',
        ]);
      });

      it('limits to 10 clinicians maximum', () => {
        const { result } = renderHook(() => useRecentItems(), {
          wrapper: RecentItemsProvider,
        });

        // Add 12 clinicians
        act(() => {
          for (let i = 1; i <= 12; i++) {
            result.current.addRecentClinician(createMockClinician(String(i)));
          }
        });

        expect(result.current.recentClinicians).toHaveLength(10);
        expect(result.current.recentClinicians[0].id).toBe('12');
        expect(
          result.current.recentClinicians.find((c) => c.id === '1'),
        ).toBeUndefined();
      });
    });

    describe('updateRecentPatients', () => {
      it('replaces the entire patients list', () => {
        const initialPatients = [
          createMockPatient('1'),
          createMockPatient('2'),
        ];
        const newPatients = [createMockPatient('3'), createMockPatient('4')];

        const { result } = renderHook(() => useRecentItems(), {
          wrapper: ({ children }) => (
            <RecentItemsProvider initialPatients={initialPatients}>
              {children}
            </RecentItemsProvider>
          ),
        });

        expect(result.current.recentPatients).toEqual(initialPatients);

        act(() => {
          result.current.updateRecentPatients(newPatients);
        });

        expect(result.current.recentPatients).toEqual(newPatients);
      });
    });

    describe('updateRecentClinicians', () => {
      it('replaces the entire clinicians list', () => {
        const initialClinicians = [
          createMockClinician('1'),
          createMockClinician('2'),
        ];
        const newClinicians = [
          createMockClinician('3'),
          createMockClinician('4'),
        ];

        const { result } = renderHook(() => useRecentItems(), {
          wrapper: ({ children }) => (
            <RecentItemsProvider initialClinicians={initialClinicians}>
              {children}
            </RecentItemsProvider>
          ),
        });

        expect(result.current.recentClinicians).toEqual(initialClinicians);

        act(() => {
          result.current.updateRecentClinicians(newClinicians);
        });

        expect(result.current.recentClinicians).toEqual(newClinicians);
      });
    });
  });
});
