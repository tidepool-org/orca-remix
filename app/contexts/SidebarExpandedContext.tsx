import { createContext, useContext, useState, useMemo } from 'react';
import { useFetcher } from 'react-router';

type SidebarExpandedContextType = {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
};

const SidebarExpandedContext = createContext<
  SidebarExpandedContextType | undefined
>(undefined);

export function SidebarExpandedProvider({
  initialExpanded,
  children,
}: {
  initialExpanded: boolean;
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpandedState] = useState(initialExpanded);
  const fetcher = useFetcher();

  const setSidebarExpanded = (expanded: boolean) => {
    setSidebarExpandedState(expanded);
    fetcher.submit(
      { expanded: expanded.toString() },
      { method: 'post', action: '/action/set-sidebar' },
    );
  };

  const value = useMemo(
    () => ({ sidebarExpanded, setSidebarExpanded }),
    [sidebarExpanded],
  );

  return (
    <SidebarExpandedContext.Provider value={value}>
      {children}
    </SidebarExpandedContext.Provider>
  );
}

export function useSidebarExpanded() {
  const context = useContext(SidebarExpandedContext);
  if (!context) {
    throw new Error(
      'useSidebarExpanded must be used within a SidebarExpandedProvider',
    );
  }
  return context;
}
