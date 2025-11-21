import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RecentPatient, RecentClinician } from './types';

type RecentItemsContextType = {
  recentPatients: RecentPatient[];
  recentClinicians: RecentClinician[];
  addRecentPatient: (patient: RecentPatient) => void;
  addRecentClinician: (clinician: RecentClinician) => void;
  updateRecentPatients: (patients: RecentPatient[]) => void;
  updateRecentClinicians: (clinicians: RecentClinician[]) => void;
};

const RecentItemsContext = createContext<RecentItemsContextType | undefined>(undefined);

export function useRecentItems() {
  const context = useContext(RecentItemsContext);
  if (!context) {
    throw new Error('useRecentItems must be used within a RecentItemsProvider');
  }
  return context;
}

type RecentItemsProviderProps = {
  children: React.ReactNode;
  initialPatients?: RecentPatient[];
  initialClinicians?: RecentClinician[];
};

export function RecentItemsProvider({
  children,
  initialPatients = [],
  initialClinicians = []
}: RecentItemsProviderProps) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>(initialPatients);
  const [recentClinicians, setRecentClinicians] = useState<RecentClinician[]>(initialClinicians);

  const addRecentPatient = useCallback((patient: RecentPatient) => {
    setRecentPatients(prev => {
      // Remove existing entry if present
      const filtered = prev.filter(p => p.id !== patient.id);
      // Add to beginning and keep only last 10
      return [patient, ...filtered].slice(0, 10);
    });
  }, []);

  const addRecentClinician = useCallback((clinician: RecentClinician) => {
    setRecentClinicians(prev => {
      // Remove existing entry if present
      const filtered = prev.filter(c => c.id !== clinician.id);
      // Add to beginning and keep only last 10
      return [clinician, ...filtered].slice(0, 10);
    });
  }, []);

  const updateRecentPatients = useCallback((patients: RecentPatient[]) => {
    setRecentPatients(patients);
  }, []);

  const updateRecentClinicians = useCallback((clinicians: RecentClinician[]) => {
    setRecentClinicians(clinicians);
  }, []);

  return (
    <RecentItemsContext.Provider
      value={{
        recentPatients,
        recentClinicians,
        addRecentPatient,
        addRecentClinician,
        updateRecentPatients,
        updateRecentClinicians,
      }}
    >
      {children}
    </RecentItemsContext.Provider>
  );
}
