import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useFetcher } from 'react-router';

type ProfileExpandedContextType = {
  profileExpandedMap: Record<string, boolean>;
  setProfileExpanded: (profileType: string, expanded: boolean) => void;
};

const ProfileExpandedContext = createContext<
  ProfileExpandedContextType | undefined
>(undefined);

export function ProfileExpandedProvider({
  initialExpandedMap,
  children,
}: {
  initialExpandedMap: Record<string, boolean>;
  children: React.ReactNode;
}) {
  const [profileExpandedMap, setProfileExpandedMap] =
    useState(initialExpandedMap);
  const fetcher = useFetcher();

  const setProfileExpanded = useCallback(
    (profileType: string, expanded: boolean) => {
      setProfileExpandedMap((prev) => ({ ...prev, [profileType]: expanded }));
      fetcher.submit(
        { profileType, expanded: expanded.toString() },
        { method: 'post', action: '/action/set-profile-expanded' },
      );
    },
    [fetcher],
  );

  const value = useMemo(
    () => ({ profileExpandedMap, setProfileExpanded }),
    [profileExpandedMap, setProfileExpanded],
  );

  return (
    <ProfileExpandedContext.Provider value={value}>
      {children}
    </ProfileExpandedContext.Provider>
  );
}

export function useProfileExpandedContext() {
  const context = useContext(ProfileExpandedContext);
  if (!context) {
    throw new Error(
      'useProfileExpandedContext must be used within a ProfileExpandedProvider',
    );
  }
  return context;
}
