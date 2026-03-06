import { createContext, useContext, useState, useEffect, useMemo } from 'react';

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

  const setSidebarExpanded = (expanded: boolean) => {
    setSidebarExpandedState(expanded);
    localStorage.setItem('sidebar-expanded', expanded.toString());
  };

  // Sync sidebar state from keyboard shortcut toggle (uses StorageEvent)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sidebar-expanded') {
        setSidebarExpandedState(
          localStorage.getItem('sidebar-expanded') === 'true',
        );
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
