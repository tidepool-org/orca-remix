import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import {
  TrustingAccountsTable,
  TrustedAccountsTable,
  SentInvitesTable,
  ReceivedInvitesTable,
} from './DataSharingSection';
import { CollapsibleGroup } from '~/components/ui/CollapsibleGroup';
import type { AccessPermissionsMap, ShareInvite } from './types';
import type { ResourceState } from '~/api.types';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useLocale
vi.mock('~/hooks/useLocale', () => ({
  default: () => ({ locale: 'en-US', direction: 'ltr' }),
}));

// Mock ClipboardButton since CopyableIdentifier uses it
vi.mock('~/components/ui/ClipboardButton', () => ({
  default: ({ clipboardText }: { clipboardText: string }) => (
    <button type="button" aria-label="Copy to clipboard">
      Copy
    </button>
  ),
}));

const renderExpanded = (ui: React.ReactNode) => {
  return render(<CollapsibleGroup>{ui}</CollapsibleGroup>);
};

// --- Shared Test Data ---

const mockUserProfiles = {
  'user-aaa': 'Alice',
  'user-bbb': 'Bob',
  'user-ccc': 'Carol',
} as Record<string, string>;

const mockPermissionsMap: AccessPermissionsMap = {
  'user-aaa': { root: {}, view: {} },
  'user-bbb': { custodian: {}, upload: {} },
  'user-ccc': { note: {} },
};

const mockErrorState: ResourceState<AccessPermissionsMap> = {
  status: 'error',
  error: { message: 'Failed to load sharing data' },
};

const mockInvite: ShareInvite = {
  key: 'inv-1',
  type: 'careteam_invitation',
  status: 'pending',
  email: 'alice@example.com',
  creatorId: 'user-aaa',
  created: '2025-01-15T10:00:00Z',
  creator: {
    userid: 'user-aaa',
    profile: { fullName: 'Alice' },
  },
};

const mockInviteNoCreator: ShareInvite = {
  key: 'inv-2',
  type: 'clinician_invitation',
  status: 'completed',
  email: 'bob@example.com',
  creatorId: 'user-bbb',
  created: '2025-02-20T14:30:00Z',
  // No creator field
};

// --- TrustingAccountsTable Tests ---

describe('TrustingAccountsTable', () => {
  const defaultProps = {
    accounts: mockPermissionsMap,
    isLoading: false,
    currentUserId: 'user-current',
    userProfiles: mockUserProfiles,
    isFirstInGroup: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      expect(
        screen.getByText('Accounts Sharing With User (3)'),
      ).toBeInTheDocument();
    });

    it('renders introductory text', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      expect(
        screen.getByText(
          /these accounts have granted this user access to view their data/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders user profile names', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Carol')).toBeInTheDocument();
    });

    it('renders user IDs in CopyableIdentifier', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      expect(screen.getByText('user-aaa')).toBeInTheDocument();
      expect(screen.getByText('user-bbb')).toBeInTheDocument();
      expect(screen.getByText('user-ccc')).toBeInTheDocument();
    });

    it('renders permission chips', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Custodian')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('falls back to "Unknown" when no user profile', () => {
      renderExpanded(
        <TrustingAccountsTable {...defaultProps} userProfiles={{}} />,
      );

      // All entries without a profile show "Unknown" as name
      const unknownElements = screen.queryAllByText('Unknown');
      expect(unknownElements.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('filters by user profile name (case-insensitive)', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      await user.type(
        screen.getByLabelText('Filter accounts by name or user ID'),
        'ali',
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      expect(screen.queryByText('Carol')).not.toBeInTheDocument();
    });

    it('filters by user ID', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      await user.type(
        screen.getByLabelText('Filter accounts by name or user ID'),
        'user-bbb',
      );

      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Carol')).not.toBeInTheDocument();
    });

    it('shows all results when filter is cleared', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      const filterInput = screen.getByLabelText(
        'Filter accounts by name or user ID',
      );
      await user.type(filterInput, 'ali');
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();

      // Clear the filter
      await user.clear(filterInput);

      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by user profile name', () => {
      // Carol (c), Alice (a), Bob (b) should sort to Alice, Bob, Carol
      const unsortedAccounts: AccessPermissionsMap = {
        'user-ccc': { view: {} },
        'user-aaa': { root: {} },
        'user-bbb': { custodian: {} },
      };

      renderExpanded(
        <TrustingAccountsTable {...defaultProps} accounts={unsortedAccounts} />,
      );

      const rows = screen.getAllByRole('row');
      // First row is header, so data rows start at index 1
      const names = rows.slice(1).map((row) => {
        const cells = row.querySelectorAll('td');
        return cells[0]?.textContent;
      });

      expect(names).toEqual(['Alice', 'Bob', 'Carol']);
    });
  });

  describe('Exclusion of currentUserId', () => {
    it('filters out the current user from the list', () => {
      const accountsWithCurrentUser: AccessPermissionsMap = {
        'user-current': { root: {} },
        'user-aaa': { view: {} },
      };

      renderExpanded(
        <TrustingAccountsTable
          {...defaultProps}
          accounts={accountsWithCurrentUser}
        />,
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('user-current')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('does not show pagination when items fit on one page', () => {
      renderExpanded(
        <TrustingAccountsTable
          {...defaultProps}
          accounts={{ 'user-aaa': { view: {} } }}
        />,
      );

      // With only 1 item and PAGE_SIZE=25, no pagination should show
      expect(
        screen.queryByRole('navigation', { name: /pagination/i }),
      ).not.toBeInTheDocument();
    });

    it('renders pagination controls when items exceed page size', () => {
      const largeAccounts: AccessPermissionsMap = {};
      for (let i = 0; i < 30; i++) {
        largeAccounts[`user-${i}`] = { view: {} };
      }

      renderExpanded(
        <TrustingAccountsTable
          {...defaultProps}
          accounts={largeAccounts}
          userProfiles={{}}
        />,
      );

      expect(
        screen.getByRole('navigation', { name: /pagination/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to user page when a row is selected', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      // Click on the first user row
      const rows = screen.getAllByRole('row');
      await user.click(rows[1]); // First data row

      expect(mockNavigate).toHaveBeenCalledWith('/users/user-aaa');
    });
  });

  describe('Error State', () => {
    it('shows error message when trustingAccountsState has error', () => {
      renderExpanded(
        <TrustingAccountsTable
          {...defaultProps}
          trustingAccountsState={mockErrorState}
        />,
      );

      expect(
        screen.getByText('Failed to load sharing data'),
      ).toBeInTheDocument();
    });

    it('does not show filter input or table in error state', () => {
      renderExpanded(
        <TrustingAccountsTable
          {...defaultProps}
          trustingAccountsState={mockErrorState}
        />,
      );

      expect(
        screen.queryByLabelText('Filter accounts by name or user ID'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no accounts share data', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} accounts={{}} />);

      expect(
        screen.getByText('No accounts are sharing data with this user'),
      ).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} isLoading />);

      // TableLoadingState renders a spinner with "Loading..." text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(<TrustingAccountsTable {...defaultProps} />);

      const table = screen.getByRole('grid', {
        name: 'Accounts sharing with user',
      });
      expect(table).toBeInTheDocument();
    });
  });
});

// --- TrustedAccountsTable Tests ---

describe('TrustedAccountsTable', () => {
  const defaultProps = {
    accounts: mockPermissionsMap,
    isLoading: false,
    currentUserId: 'user-current',
    userProfiles: mockUserProfiles,
    isFirstInGroup: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      expect(
        screen.getByText('Accounts User Shares With (3)'),
      ).toBeInTheDocument();
    });

    it('renders introductory text', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      expect(
        screen.getByText(/these accounts can view this user/i),
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders permission chips', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Custodian')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('falls back to "Unknown" when no user profile', () => {
      renderExpanded(
        <TrustedAccountsTable {...defaultProps} userProfiles={{}} />,
      );

      const unknownElements = screen.queryAllByText('Unknown');
      expect(unknownElements.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('filters by user profile name', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      await user.type(
        screen.getByLabelText('Filter accounts by name or user ID'),
        'ali',
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });
  });

  describe('Exclusion of currentUserId', () => {
    it('filters out the current user from the list', () => {
      const accountsWithCurrentUser: AccessPermissionsMap = {
        'user-current': { root: {} },
        'user-aaa': { view: {} },
      };

      renderExpanded(
        <TrustedAccountsTable
          {...defaultProps}
          accounts={accountsWithCurrentUser}
        />,
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('user-current')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to user page when a row is selected', async () => {
      const user = userEvent.setup();
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      await user.click(rows[1]);

      expect(mockNavigate).toHaveBeenCalledWith('/users/user-aaa');
    });
  });

  describe('Error State', () => {
    it('shows error message when trustedAccountsState has error', () => {
      renderExpanded(
        <TrustedAccountsTable
          {...defaultProps}
          trustedAccountsState={mockErrorState}
        />,
      );

      expect(
        screen.getByText('Failed to load sharing data'),
      ).toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when user shares data with no one', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} accounts={{}} />);

      expect(
        screen.getByText('This user is not sharing data with anyone'),
      ).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} isLoading />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(<TrustedAccountsTable {...defaultProps} />);

      const table = screen.getByRole('grid', {
        name: 'Accounts user shares with',
      });
      expect(table).toBeInTheDocument();
    });
  });
});

// --- SentInvitesTable Tests ---

describe('SentInvitesTable', () => {
  const defaultProps = {
    invites: [mockInvite],
    isLoading: false,
    isFirstInGroup: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      expect(screen.getByText('Sent Invites (1)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      expect(screen.getByText('Invitee Email')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Sent Date')).toBeInTheDocument();
    });

    it('renders introductory text', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      expect(
        screen.getByText(
          /pending invitations sent by this user to share their data/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders invitee email in CopyableIdentifier', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('formats invite type for display', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      expect(screen.getByText('Careteam Invitation')).toBeInTheDocument();
    });

    it('renders status chip', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      const table = screen.getByRole('grid', { name: /Sent invites/i });
      expect(within(table).getByText(/pending/i)).toBeInTheDocument();
    });

    it('formats date using locale', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      // formatShortDate with en-US locale formats "2025-01-15T10:00:00Z"
      expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('does not show pagination when items fit on one page', () => {
      renderExpanded(
        <SentInvitesTable {...defaultProps} invites={[mockInvite]} />,
      );

      expect(
        screen.queryByRole('navigation', { name: /pagination/i }),
      ).not.toBeInTheDocument();
    });

    it('renders pagination controls when items exceed page size', () => {
      const manyInvites: ShareInvite[] = Array.from({ length: 30 }, (_, i) => ({
        ...mockInvite,
        key: `inv-${i}`,
        email: `user${i}@example.com`,
      }));

      renderExpanded(
        <SentInvitesTable {...defaultProps} invites={manyInvites} />,
      );

      expect(
        screen.getByRole('navigation', { name: /pagination/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when sentInvitesState has error', () => {
      const errorState: ResourceState<ShareInvite[]> = {
        status: 'error',
        error: { message: 'Failed to load invites' },
      };

      renderExpanded(
        <SentInvitesTable {...defaultProps} sentInvitesState={errorState} />,
      );

      expect(screen.getByText('Failed to load invites')).toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no invites', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} invites={[]} />);

      expect(screen.getByText('No pending sent invites')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      renderExpanded(
        <SentInvitesTable {...defaultProps} invites={[]} isLoading />,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(<SentInvitesTable {...defaultProps} />);

      const table = screen.getByRole('grid', {
        name: 'Sent invites',
      });
      expect(table).toBeInTheDocument();
    });
  });

  describe('Type Formatting', () => {
    it('formats all invite types for display', () => {
      const passwordResetInvite: ShareInvite = {
        ...mockInvite,
        key: 'inv-reset',
        type: 'password_reset',
      };
      const signupInvite: ShareInvite = {
        ...mockInvite,
        key: 'inv-signup',
        type: 'signup_confirmation',
      };
      const noAccountInvite: ShareInvite = {
        ...mockInvite,
        key: 'inv-noaccount',
        type: 'no_account',
      };

      renderExpanded(
        <SentInvitesTable
          {...defaultProps}
          invites={[
            passwordResetInvite,
            signupInvite,
            noAccountInvite,
          ]}
        />,
      );

      expect(screen.getByText('Password Reset')).toBeInTheDocument();
      expect(screen.getByText('Signup Confirmation')).toBeInTheDocument();
      expect(screen.getByText('No Account')).toBeInTheDocument();
    });
  });
});

// --- ReceivedInvitesTable Tests ---

describe('ReceivedInvitesTable', () => {
  const defaultProps = {
    invites: [mockInvite],
    isLoading: false,
    isFirstInGroup: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(screen.getByText('Received Invites (1)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Received Date')).toBeInTheDocument();
    });

    it('renders introductory text', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(
        screen.getByText(
          /pending invitations received by this user from others/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders creator name and ID', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('user-aaa')).toBeInTheDocument();
    });

    it('renders status chip', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      const table = screen.getByRole('grid', { name: /Received invites/i });
      expect(within(table).getByText(/pending/i)).toBeInTheDocument();
    });

    it('formats invite type for display', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(screen.getByText('Careteam Invitation')).toBeInTheDocument();
    });

    it('formats date using locale', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument();
    });

    it('shows "Unknown" when creator has no profile name', () => {
      renderExpanded(
        <ReceivedInvitesTable
          {...defaultProps}
          invites={[mockInviteNoCreator]}
        />,
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('does not show pagination when items fit on one page', () => {
      renderExpanded(
        <ReceivedInvitesTable {...defaultProps} invites={[mockInvite]} />,
      );

      expect(
        screen.queryByRole('navigation', { name: /pagination/i }),
      ).not.toBeInTheDocument();
    });

    it('renders pagination controls when items exceed page size', () => {
      const manyInvites: ShareInvite[] = Array.from({ length: 30 }, (_, i) => ({
        ...mockInvite,
        key: `inv-${i}`,
        email: `user${i}@example.com`,
      }));

      renderExpanded(
        <ReceivedInvitesTable {...defaultProps} invites={manyInvites} />,
      );

      expect(
        screen.getByRole('navigation', { name: /pagination/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to creator user page when a row is selected', async () => {
      const user = userEvent.setup();
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      await user.click(rows[1]);

      expect(mockNavigate).toHaveBeenCalledWith('/users/user-aaa');
    });
  });

  describe('Error State', () => {
    it('shows error message when receivedInvitesState has error', () => {
      const errorState: ResourceState<ShareInvite[]> = {
        status: 'error',
        error: { message: 'Failed to load invites' },
      };

      renderExpanded(
        <ReceivedInvitesTable
          {...defaultProps}
          receivedInvitesState={errorState}
        />,
      );

      expect(screen.getByText('Failed to load invites')).toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no invites received', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} invites={[]} />);

      expect(
        screen.getByText('No pending received invites'),
      ).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      renderExpanded(
        <ReceivedInvitesTable {...defaultProps} invites={[]} isLoading />,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(<ReceivedInvitesTable {...defaultProps} />);

      const table = screen.getByRole('grid', {
        name: 'Received invites',
      });
      expect(table).toBeInTheDocument();
    });
  });
});
