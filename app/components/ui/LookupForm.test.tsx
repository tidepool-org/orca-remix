import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import LookupForm from './LookupForm';
import { Search } from 'lucide-react';

// Mock react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    Form: ({
      children,
      action,
    }: {
      children: React.ReactNode;
      action: string;
    }) => (
      <form action={action} data-testid="lookup-form">
        {children}
      </form>
    ),
    useSearchParams: () => [new URLSearchParams()],
    useNavigation: () => ({ state: 'idle', location: null }),
  };
});

// Mock ToastContext
const mockShowToast = vi.fn();
vi.mock('~/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('LookupForm', () => {
  const defaultProps = {
    action: '/clinics',
    icon: Search,
    title: 'Clinic Lookup',
    placeholder: 'Clinic ID or Share Code',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the section header with title', () => {
      render(<LookupForm {...defaultProps} />);

      expect(screen.getByText('Clinic Lookup')).toBeInTheDocument();
    });

    it('renders the input with placeholder', () => {
      render(<LookupForm {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('Clinic ID or Share Code'),
      ).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      render(<LookupForm {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /search/i }),
      ).toBeInTheDocument();
    });

    it('renders with custom submit text', () => {
      render(<LookupForm {...defaultProps} submitText="Find Clinic" />);

      expect(
        screen.getByRole('button', { name: /find clinic/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Input behavior', () => {
    it('allows typing in the input field', async () => {
      const user = userEvent.setup();
      render(<LookupForm {...defaultProps} />);

      const input = screen.getByPlaceholderText('Clinic ID or Share Code');
      await user.type(input, 'test-clinic-id');

      expect(input).toHaveValue('test-clinic-id');
    });

    it('uses searchParamName as input name by default', () => {
      render(<LookupForm {...defaultProps} searchParamName="clinicSearch" />);

      const input = screen.getByPlaceholderText('Clinic ID or Share Code');
      expect(input).toHaveAttribute('name', 'clinicSearch');
    });

    it('uses inputName when provided', () => {
      render(
        <LookupForm
          {...defaultProps}
          searchParamName="clinicSearch"
          inputName="customName"
        />,
      );

      const input = screen.getByPlaceholderText('Clinic ID or Share Code');
      expect(input).toHaveAttribute('name', 'customName');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on input (defaults to placeholder)', () => {
      render(<LookupForm {...defaultProps} />);

      const input = screen.getByPlaceholderText('Clinic ID or Share Code');
      expect(input).toHaveAttribute('aria-label', 'Clinic ID or Share Code');
    });

    it('uses custom aria-label when provided', () => {
      render(
        <LookupForm
          {...defaultProps}
          aria-label="Search for clinics by ID or share code"
        />,
      );

      const input = screen.getByLabelText(
        'Search for clinics by ID or share code',
      );
      expect(input).toBeInTheDocument();
    });
  });

  describe('Validation errors', () => {
    it('shows inline error for validation errors', () => {
      render(
        <LookupForm
          {...defaultProps}
          error="Invalid clinic ID format"
          errorType="validation"
        />,
      );

      expect(screen.getByText('Invalid clinic ID format')).toBeInTheDocument();
    });

    it('marks input as invalid for validation errors', () => {
      render(
        <LookupForm
          {...defaultProps}
          error="Invalid clinic ID format"
          errorType="validation"
        />,
      );

      const input = screen.getByPlaceholderText('Clinic ID or Share Code');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not show inline error for API errors', () => {
      render(
        <LookupForm
          {...defaultProps}
          error="Server error occurred"
          errorType="api"
        />,
      );

      // API errors show as toast, not inline
      expect(
        screen.queryByText('Server error occurred'),
      ).not.toBeInTheDocument();
    });

    it('shows toast for API errors', async () => {
      render(
        <LookupForm
          {...defaultProps}
          error="Server error occurred"
          errorType="api"
        />,
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Server error occurred',
          'error',
        );
      });
    });
  });

  describe('Form action', () => {
    it('sets the correct form action', () => {
      render(<LookupForm {...defaultProps} action="/users" />);

      const form = screen.getByTestId('lookup-form');
      expect(form).toHaveAttribute('action', '/users');
    });
  });
});
