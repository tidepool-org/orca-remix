import { describe, it, expect, vi } from 'vitest';
import { createRoutesStub } from 'react-router';
import { render, screen } from '~/test-utils';
import { ToastProvider } from '~/contexts/ToastContext';
import PatientProfile from './PatientProfile';
import type { Patient } from './types';

vi.mock('~/hooks/useProfileExpanded', () => ({
  default: () => ({ defaultExpanded: false, onExpandedChange: vi.fn() }),
}));

const basePatient: Patient = {
  id: 'patient-1',
  fullName: 'Test Patient',
  birthDate: '2000-01-01',
  createdTime: '2022-03-21T00:00:00.000Z',
  updatedTime: '2022-03-21T00:00:00.000Z',
};

// The tab tables call useFetcher and useToast, which need a data router
// and a toast provider.
function renderProfile(highwaterHash?: string | null) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => (
        <ToastProvider>
          <PatientProfile patient={basePatient} highwaterHash={highwaterHash} />
        </ToastProvider>
      ),
    },
  ]);
  render(<Stub />);
}

describe('PatientProfile — highwater hash identifier', () => {
  it('shows the HASH identifier when a hash is provided', async () => {
    renderProfile('59f12da533');
    expect(await screen.findByText('HASH')).toBeInTheDocument();
    expect(screen.getByText('59f12da533')).toBeInTheDocument();
  });

  it('omits the HASH identifier when no hash is provided', async () => {
    renderProfile();
    expect(await screen.findByText('patient-1')).toBeInTheDocument();
    expect(screen.queryByText('HASH')).not.toBeInTheDocument();
  });
});
