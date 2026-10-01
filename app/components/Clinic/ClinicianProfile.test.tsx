import { describe, it, expect, vi } from 'vitest';
import { createRoutesStub } from 'react-router';
import { render, screen } from '~/test-utils';
import { ToastProvider } from '~/contexts/ToastContext';
import ClinicianProfile from './ClinicianProfile';
import type { Clinician } from './types';

vi.mock('~/hooks/useProfileExpanded', () => ({
  default: () => ({ defaultExpanded: false, onExpandedChange: vi.fn() }),
}));

const baseClinician: Clinician = {
  id: 'clinician-1',
  email: 'clinician@example.com',
  name: 'Test Clinician',
  roles: ['CLINIC_MEMBER'],
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
          <ClinicianProfile
            clinician={baseClinician}
            highwaterHash={highwaterHash}
          />
        </ToastProvider>
      ),
    },
  ]);
  render(<Stub />);
}

describe('ClinicianProfile — highwater hash identifier', () => {
  it('shows the HASH identifier when a hash is provided', async () => {
    renderProfile('59f12da533');
    expect(await screen.findByText('HASH')).toBeInTheDocument();
    expect(screen.getByText('59f12da533')).toBeInTheDocument();
  });

  it('omits the HASH identifier when no hash is provided', async () => {
    renderProfile();
    expect(await screen.findByText('clinician-1')).toBeInTheDocument();
    expect(screen.queryByText('HASH')).not.toBeInTheDocument();
  });
});
