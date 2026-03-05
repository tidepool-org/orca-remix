import { useCallback } from 'react';

const getStorageKey = (profileType: string) =>
  `profileHeader-${profileType}-expanded`;

export default function useProfileExpanded(profileType: string) {
  const defaultExpanded =
    typeof window !== 'undefined'
      ? localStorage.getItem(getStorageKey(profileType)) === 'true'
      : false;

  const onExpandedChange = useCallback(
    (expanded: boolean) => {
      localStorage.setItem(getStorageKey(profileType), String(expanded));
    },
    [profileType],
  );

  return { defaultExpanded, onExpandedChange };
}
