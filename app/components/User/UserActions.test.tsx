import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import UserActions from './UserActions';
import type { User } from './types';

// Mock toast context
const mockShowToast = vi.fn();
vi.mock('~/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useFetcher
const mockSubmit = vi.fn();
let mockFetcherState = 'idle';
let mockFetcherData: unknown = null;

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useFetcher: () => ({
      submit: mockSubmit,
      state: mockFetcherState,
      data: mockFetcherData,
    }),
  };
});

describe('UserActions', () => {
  const claimedUser: User = {
    userid: 'user-123',
    username: 'alice@example.com',
    emailVerified: false,
  };

  const verifiedUser: User = {
    userid: 'user-456',
    username: 'bob@example.com',
    emailVerified: true,
  };

  const unclaimedUser: User = {
    userid: 'user-789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetcherState = 'idle';
    mockFetcherData = null;
  });

  describe('Action buttons for claimed unverified user', () => {
    it('renders all action buttons enabled', () => {
      render(<UserActions user={claimedUser} />);

      expect(
        screen.getByRole('button', { name: /verify email/i }),
      ).toBeEnabled();
      expect(screen.getByRole('button', { name: /send reset/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /^send$/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /resend/i })).toBeEnabled();
    });
  });

  describe('Disabled states for verified user', () => {
    it('disables verify and confirmation buttons when email is verified', () => {
      render(<UserActions user={verifiedUser} />);

      expect(
        screen.getByRole('button', { name: /verify email/i }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled();
      // Password reset should remain enabled
      expect(screen.getByRole('button', { name: /send reset/i })).toBeEnabled();
    });
  });

  describe('Disabled states for unclaimed account', () => {
    it('disables email-related buttons for unclaimed accounts', () => {
      render(<UserActions user={unclaimedUser} />);

      expect(
        screen.getByRole('button', { name: /verify email/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /send reset/i }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled();
    });
  });

  describe('Danger zone actions', () => {
    it('renders danger zone as collapsed by default', () => {
      render(<UserActions user={claimedUser} />);

      // Danger zone title should be visible as a collapsible header
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      // But the delete buttons inside should not be visible by default
      expect(
        screen.queryByRole('button', { name: /delete data/i }),
      ).not.toBeInTheDocument();
    });

    it('shows delete buttons when danger zone is expanded', async () => {
      const user = userEvent.setup();
      render(<UserActions user={claimedUser} />);

      // Click the Danger Zone heading to expand
      const dangerZoneButton = screen.getByRole('button', {
        name: /danger zone/i,
      });
      await user.click(dangerZoneButton);

      expect(
        screen.getByRole('button', { name: /delete data/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Confirmation modals', () => {
    it('opens confirmation modal on verify email click', async () => {
      const user = userEvent.setup();
      render(<UserActions user={claimedUser} />);

      await user.click(screen.getByRole('button', { name: /verify email/i }));

      expect(screen.getByText('Verify User Email')).toBeInTheDocument();
      expect(
        screen.getByText(/manually verify the email address/i),
      ).toBeInTheDocument();
    });

    it('submits verify-email action on confirm', async () => {
      const user = userEvent.setup();
      render(<UserActions user={claimedUser} />);

      await user.click(screen.getByRole('button', { name: /verify email/i }));
      // Click confirm in the modal
      await user.click(screen.getByRole('button', { name: /verify email/i }));

      expect(mockSubmit).toHaveBeenCalledWith(
        { intent: 'verify-email' },
        { method: 'post' },
      );
    });

    it('requires typed confirmation for destructive actions', async () => {
      const user = userEvent.setup();
      render(<UserActions user={claimedUser} />);

      // Expand danger zone
      await user.click(screen.getByRole('button', { name: /danger zone/i }));
      // Click delete account
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      // Confirm button should be disabled until input matches
      const confirmButton = screen.getByRole('button', {
        name: /^delete account$/i,
      });
      expect(confirmButton).toBeDisabled();

      // Type the expected input (email for claimed users)
      const confirmInput = screen.getByPlaceholderText(
        /enter email or user id/i,
      );
      await user.type(confirmInput, 'alice@example.com');

      await waitFor(() => {
        expect(confirmButton).toBeEnabled();
      });
    });

    it('uses userid for confirmation when user is unclaimed', async () => {
      const user = userEvent.setup();
      render(<UserActions user={unclaimedUser} />);

      // Expand danger zone
      await user.click(screen.getByRole('button', { name: /danger zone/i }));
      // Delete data is always available regardless of claim status
      await user.click(screen.getByRole('button', { name: /delete data/i }));

      // The expected input for unclaimed user should be the userid
      expect(
        screen.getByText(/type "user-789" to confirm/i),
      ).toBeInTheDocument();
    });
  });
});
