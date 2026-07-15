import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useClinicResolvers, { type ClinicData } from './useClinicResolvers';

describe('useClinicResolvers', () => {
  const mockClinicData: ClinicData = {
    patientTags: [
      { id: 'tag-1', name: 'Type 1' },
      { id: 'tag-2', name: 'Type 2' },
      { id: 'tag-3', name: 'Pediatric' },
    ],
    sites: [
      { id: 'site-1', name: 'Main Campus' },
      { id: 'site-2', name: 'Downtown Office' },
      { id: 'site-3', name: 'Remote Clinic' },
    ],
  };

  describe('getTagName', () => {
    it('resolves tag ID to tag name', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getTagName('tag-1')).toBe('Type 1');
      expect(result.current.getTagName('tag-2')).toBe('Type 2');
      expect(result.current.getTagName('tag-3')).toBe('Pediatric');
    });

    it('returns tag ID when tag is not found', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getTagName('unknown-tag')).toBe('unknown-tag');
    });

    it('returns tag ID when clinicData is undefined', () => {
      const { result } = renderHook(() => useClinicResolvers(undefined));

      expect(result.current.getTagName('any-tag')).toBe('any-tag');
    });

    it('returns tag ID when patientTags is undefined', () => {
      const { result } = renderHook(() => useClinicResolvers({ sites: [] }));

      expect(result.current.getTagName('tag-1')).toBe('tag-1');
    });

    it('returns tag ID when patientTags is empty', () => {
      const { result } = renderHook(() =>
        useClinicResolvers({ patientTags: [] }),
      );

      expect(result.current.getTagName('tag-1')).toBe('tag-1');
    });
  });

  describe('getSiteName', () => {
    it('resolves site ID to site name', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getSiteName('site-1')).toBe('Main Campus');
      expect(result.current.getSiteName('site-2')).toBe('Downtown Office');
      expect(result.current.getSiteName('site-3')).toBe('Remote Clinic');
    });

    it('returns site ID when site is not found', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getSiteName('unknown-site')).toBe('unknown-site');
    });

    it('returns site ID when clinicData is undefined', () => {
      const { result } = renderHook(() => useClinicResolvers(undefined));

      expect(result.current.getSiteName('any-site')).toBe('any-site');
    });

    it('returns site ID when sites is undefined', () => {
      const { result } = renderHook(() =>
        useClinicResolvers({ patientTags: [] }),
      );

      expect(result.current.getSiteName('site-1')).toBe('site-1');
    });

    it('returns site ID when sites is empty', () => {
      const { result } = renderHook(() => useClinicResolvers({ sites: [] }));

      expect(result.current.getSiteName('site-1')).toBe('site-1');
    });
  });

  describe('getTagNames', () => {
    it('resolves multiple tag IDs to tag names', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getTagNames(['tag-1', 'tag-2'])).toEqual([
        'Type 1',
        'Type 2',
      ]);
    });

    it('returns empty array for empty input', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getTagNames([])).toEqual([]);
    });

    it('handles mix of found and not found tags', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getTagNames(['tag-1', 'unknown', 'tag-3'])).toEqual(
        ['Type 1', 'unknown', 'Pediatric'],
      );
    });

    it('returns IDs when clinicData is undefined', () => {
      const { result } = renderHook(() => useClinicResolvers(undefined));

      expect(result.current.getTagNames(['tag-1', 'tag-2'])).toEqual([
        'tag-1',
        'tag-2',
      ]);
    });
  });

  describe('getSiteNames', () => {
    it('resolves multiple site IDs to site names', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getSiteNames(['site-1', 'site-2'])).toEqual([
        'Main Campus',
        'Downtown Office',
      ]);
    });

    it('returns empty array for empty input', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(result.current.getSiteNames([])).toEqual([]);
    });

    it('handles mix of found and not found sites', () => {
      const { result } = renderHook(() => useClinicResolvers(mockClinicData));

      expect(
        result.current.getSiteNames(['site-1', 'unknown', 'site-3']),
      ).toEqual(['Main Campus', 'unknown', 'Remote Clinic']);
    });

    it('returns IDs when clinicData is undefined', () => {
      const { result } = renderHook(() => useClinicResolvers(undefined));

      expect(result.current.getSiteNames(['site-1', 'site-2'])).toEqual([
        'site-1',
        'site-2',
      ]);
    });
  });

  describe('memoization', () => {
    it('returns stable function references when clinicData does not change', () => {
      const { result, rerender } = renderHook(() =>
        useClinicResolvers(mockClinicData),
      );

      const initialGetTagName = result.current.getTagName;
      const initialGetSiteName = result.current.getSiteName;
      const initialGetTagNames = result.current.getTagNames;
      const initialGetSiteNames = result.current.getSiteNames;

      rerender();

      expect(result.current.getTagName).toBe(initialGetTagName);
      expect(result.current.getSiteName).toBe(initialGetSiteName);
      expect(result.current.getTagNames).toBe(initialGetTagNames);
      expect(result.current.getSiteNames).toBe(initialGetSiteNames);
    });

    it('updates functions when clinicData changes', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useClinicResolvers(data),
        { initialProps: { data: mockClinicData } },
      );

      const initialGetTagName = result.current.getTagName;

      const newClinicData: ClinicData = {
        patientTags: [{ id: 'new-tag', name: 'New Tag' }],
        sites: [],
      };

      rerender({ data: newClinicData });

      // Function reference should change when data changes
      expect(result.current.getTagName).not.toBe(initialGetTagName);
      expect(result.current.getTagName('new-tag')).toBe('New Tag');
    });
  });
});
