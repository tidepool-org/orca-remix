import { useCallback } from 'react';
import { useProfileExpandedContext } from '~/contexts/ProfileExpandedContext';

export default function useProfileExpanded(profileType: string) {
  const { profileExpandedMap, setProfileExpanded } =
    useProfileExpandedContext();

  const defaultExpanded = profileExpandedMap[profileType] ?? false;

  const onExpandedChange = useCallback(
    (expanded: boolean) => {
      setProfileExpanded(profileType, expanded);
    },
    [profileType, setProfileExpanded],
  );

  return { defaultExpanded, onExpandedChange };
}
