import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useFetcher } from 'react-router';

type PumpSettingsCompareContextType = {
  compareToPrevious: boolean;
  setCompareToPrevious: (compare: boolean) => void;
};

const PumpSettingsCompareContext = createContext<
  PumpSettingsCompareContextType | undefined
>(undefined);

export function PumpSettingsCompareProvider({
  initialCompareToPrevious,
  children,
}: {
  initialCompareToPrevious: boolean;
  children: React.ReactNode;
}) {
  const [compareToPrevious, setCompareState] = useState(
    initialCompareToPrevious,
  );
  const fetcher = useFetcher();

  const setCompareToPrevious = useCallback(
    (compare: boolean) => {
      setCompareState(compare);
      fetcher.submit(
        { compareToPrevious: compare.toString() },
        { method: 'post', action: '/action/set-pump-settings-compare' },
      );
    },
    [fetcher],
  );

  const value = useMemo(
    () => ({ compareToPrevious, setCompareToPrevious }),
    [compareToPrevious, setCompareToPrevious],
  );

  return (
    <PumpSettingsCompareContext.Provider value={value}>
      {children}
    </PumpSettingsCompareContext.Provider>
  );
}

export function usePumpSettingsCompare() {
  const context = useContext(PumpSettingsCompareContext);
  if (!context) {
    throw new Error(
      'usePumpSettingsCompare must be used within a PumpSettingsCompareProvider',
    );
  }
  return context;
}
