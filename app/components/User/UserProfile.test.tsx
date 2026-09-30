import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '~/test-utils';
import UserProfile from './UserProfile';
import type { Profile, User } from './types';

// Start expanded so the detail grid renders without clicking Show Details,
// and avoid the ProfileExpandedContext (which pulls in a router).
vi.mock('~/hooks/useProfileExpanded', () => ({
  default: () => ({ defaultExpanded: true, onExpandedChange: vi.fn() }),
}));

// UserActions mounts under the Account tab and needs these.
vi.mock('~/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useFetcher: () => ({ submit: vi.fn(), state: 'idle', data: null }),
}));

const user: User = {
  userid: 'user-1',
  username: 'a@b.c',
  emailVerified: true,
  termsAccepted: '2020-01-01T00:00:00Z',
};

const patientProfile: Profile = {
  email: 'a@b.c',
  fullName: 'Test User',
  patient: { birthday: '1990-04-05', emails: [] },
};

function renderUserProfile(profile: Profile) {
  render(<UserProfile user={user} profile={profile} selectedTab="account" />);
}

describe('UserProfile — header detail fields', () => {
  it('shows the formatted birth date for a patient with a birthday', () => {
    renderUserProfile(patientProfile);

    const cell = screen.getByText('Birth Date').parentElement!;
    expect(within(cell).getByText('Apr 5, 1990')).toBeInTheDocument();
  });

  it('omits the birth date when the profile has no patient block', () => {
    renderUserProfile({ email: 'a@b.c', fullName: 'Test User' });

    expect(screen.queryByText('Birth Date')).not.toBeInTheDocument();
  });
});
