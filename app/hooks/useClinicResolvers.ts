import { useCallback, useMemo } from 'react';

export type ClinicTag = {
  id: string;
  name: string;
};

export type ClinicSite = {
  id: string;
  name: string;
};

export type ClinicData = {
  patientTags?: ClinicTag[];
  sites?: ClinicSite[];
};

export type ClinicResolvers = {
  /**
   * Resolves a tag ID to its display name.
   * Falls back to the ID if the tag is not found.
   */
  getTagName: (tagId: string) => string;
  /**
   * Resolves a site ID to its display name.
   * Falls back to the ID if the site is not found.
   */
  getSiteName: (siteId: string) => string;
  /**
   * Resolves multiple tag IDs to their display names.
   */
  getTagNames: (tagIds: string[]) => string[];
  /**
   * Resolves multiple site IDs to their display names.
   */
  getSiteNames: (siteIds: string[]) => string[];
};

/**
 * Hook that provides resolver functions for mapping clinic tag and site IDs to their display names.
 *
 * @param clinicData - The clinic data containing patientTags and sites arrays
 * @returns Object with getTagName, getSiteName, getTagNames, and getSiteNames functions
 *
 * @example
 * ```tsx
 * const { getTagName, getSiteName } = useClinicResolvers(clinic)
 *
 * // Resolve a single tag
 * const tagName = getTagName('tag-123') // Returns tag name or 'tag-123' if not found
 *
 * // Resolve multiple sites
 * const siteNames = getSiteNames(['site-1', 'site-2'])
 * ```
 */
export default function useClinicResolvers(
  clinicData?: ClinicData,
): ClinicResolvers {
  // Create lookup maps for O(1) access
  const tagMap = useMemo(() => {
    const map = new Map<string, string>();
    clinicData?.patientTags?.forEach((tag) => {
      map.set(tag.id, tag.name);
    });
    return map;
  }, [clinicData?.patientTags]);

  const siteMap = useMemo(() => {
    const map = new Map<string, string>();
    clinicData?.sites?.forEach((site) => {
      map.set(site.id, site.name);
    });
    return map;
  }, [clinicData?.sites]);

  const getTagName = useCallback(
    (tagId: string): string => {
      return tagMap.get(tagId) || tagId;
    },
    [tagMap],
  );

  const getSiteName = useCallback(
    (siteId: string): string => {
      return siteMap.get(siteId) || siteId;
    },
    [siteMap],
  );

  const getTagNames = useCallback(
    (tagIds: string[]): string[] => {
      return tagIds.map((id) => getTagName(id));
    },
    [getTagName],
  );

  const getSiteNames = useCallback(
    (siteIds: string[]): string[] => {
      return siteIds.map((id) => getSiteName(id));
    },
    [getSiteName],
  );

  return {
    getTagName,
    getSiteName,
    getTagNames,
    getSiteNames,
  };
}
