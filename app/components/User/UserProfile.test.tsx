import { describe, it, expect, vi } from 'vitest';
import { createRoutesStub } from 'react-router';
import { render, screen } from '~/test-utils';
import { ToastProvider } from '~/contexts/ToastContext';
import UserProfile from './UserProfile';
import type { Profile, User } from './types';

vi.mock('~/hooks/useProfileExpanded', () => ({
  default: () => ({ defaultExpanded: false, onExpandedChange: vi.fn() }),
}));

const baseUser: User = { userid: 'user-1', username: 'user@example.com' };
const baseProfile: Profile = { email: 'user@example.com', fullName: 'Test' };

// The tab tables call useFetcher and useToast, which need a data router
// and a toast provider.
function renderProfile(highwaterHash?: string | null) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => (
        <ToastProvider>
          <UserProfile
            user={baseUser}
            profile={baseProfile}
            highwaterHash={highwaterHash}
          />
        </ToastProvider>
      ),
    },
  ]);
  render(<Stub />);
}

describe('UserProfile — highwater hash identifier', () => {
  it('shows the HASH identifier when a hash is provided', async () => {
    renderProfile('59f12da533');
    expect(await screen.findByText('HASH')).toBeInTheDocument();
    expect(screen.getByText('59f12da533')).toBeInTheDocument();
  });

  it('omits the HASH identifier when no hash is provided', async () => {
    renderProfile();
    expect(await screen.findByText('user-1')).toBeInTheDocument();
    expect(screen.queryByText('HASH')).not.toBeInTheDocument();
  });
});
