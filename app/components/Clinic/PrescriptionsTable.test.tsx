import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import PrescriptionsTable from './PrescriptionsTable';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import type { Prescription } from './types';
import type { ResourceState } from '~/api.types';

// Helper to render PrescriptionsTable in expanded state
const renderExpanded = (
  props: React.ComponentProps<typeof PrescriptionsTable>,
) => {
  return render(
    <CollapsibleGroup>
      <PrescriptionsTable {...props} isFirstInGroup />
    </CollapsibleGroup>,
  );
};

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ clinicId: 'clinic-123' }),
    useSearchParams: () => [new URLSearchParams('tab=prescriptions')],
  };
});

describe('PrescriptionsTable', () => {
  const mockPrescriptions: Prescription[] = [
    {
      id: 'rx-1',
      clinicId: 'clinic-123',
      state: 'active',
      createdTime: '2024-01-15T10:30:00Z',
      createdUserId: 'user-1',
      modifiedTime: '2024-01-15T10:30:00Z',
      modifiedUserId: 'user-1',
      expirationTime: '2025-01-15T10:30:00Z',
      latestRevision: {
        attributes: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
    {
      id: 'rx-2',
      clinicId: 'clinic-456',
      state: 'pending',
      createdTime: '2024-02-20T14:00:00Z',
      createdUserId: 'user-2',
      modifiedTime: '2024-02-20T14:00:00Z',
      modifiedUserId: 'user-2',
      latestRevision: {
        attributes: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      },
    },
    {
      id: 'rx-3',
      clinicId: 'clinic-123',
      state: 'expired',
      createdTime: '2023-06-10T09:00:00Z',
      createdUserId: 'user-3',
      modifiedTime: '2023-06-10T09:00:00Z',
      modifiedUserId: 'user-3',
      expirationTime: '2024-06-10T09:00:00Z',
      latestRevision: {
        attributes: {
          firstName: 'Bob',
        },
      },
    },
  ];

  const defaultProps = {
    prescriptions: mockPrescriptions,
    totalPrescriptions: mockPrescriptions.length,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the collapsible header with title and count', () => {
      render(<PrescriptionsTable {...defaultProps} />);

      // Header shows combined title and count
      expect(screen.getByText('Prescriptions (3)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Expires')).toBeInTheDocument();
    });

    it('renders prescription data', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders prescription IDs', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('ID: rx-1')).toBeInTheDocument();
      expect(screen.getByText('ID: rx-2')).toBeInTheDocument();
      expect(screen.getByText('ID: rx-3')).toBeInTheDocument();
    });

    it('renders status chips for prescription states', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('expired')).toBeInTheDocument();
    });

    it('displays N/A for missing expiration time', () => {
      renderExpanded(defaultProps);

      // Jane Smith's prescription has no expirationTime
      const rows = screen.getAllByRole('row');
      // Find the row with Jane Smith
      const janeRow = rows.find((row) => within(row).queryByText('Jane Smith'));
      expect(janeRow).toBeDefined();
      if (janeRow) {
        expect(within(janeRow).getByText('N/A')).toBeInTheDocument();
      }
    });

    it('displays N/A for prescription with no name attributes', () => {
      const prescriptionWithNoName: Prescription = {
        id: 'rx-noname',
        clinicId: 'clinic-123',
        state: 'draft',
        createdTime: '2024-01-01T00:00:00Z',
        createdUserId: 'user-1',
        modifiedTime: '2024-01-01T00:00:00Z',
        modifiedUserId: 'user-1',
        expirationTime: '2025-01-01T00:00:00Z', // Has expiration so only name is N/A
        latestRevision: {
          attributes: {},
        },
      };

      renderExpanded({
        prescriptions: [prescriptionWithNoName],
        totalPrescriptions: 1,
      });

      // Should show N/A for patient name in the first column (bold text)
      const table = screen.getByRole('grid');
      const naElement = within(table).getByText('N/A');
      expect(naElement).toBeInTheDocument();
      expect(naElement.tagName).toBe('P');
      expect(naElement).toHaveClass('text-bold');
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no prescriptions', () => {
      renderExpanded({
        prescriptions: [],
        totalPrescriptions: 0,
      });

      expect(screen.getByText('No prescriptions found')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading state when isLoading is true', () => {
      renderExpanded({
        prescriptions: [],
        totalPrescriptions: 0,
        isLoading: true,
      });

      expect(screen.getByText('Loading prescriptions...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when prescriptionsState has error', () => {
      const errorState: ResourceState<Prescription[]> = {
        status: 'error',
        error: { message: 'Failed to load prescriptions' },
      };

      renderExpanded({
        prescriptions: [],
        totalPrescriptions: 0,
        prescriptionsState: errorState,
      });

      expect(
        screen.getByText('Failed to load prescriptions'),
      ).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('renders filter input', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByPlaceholderText('Filter by patient name or state...'),
      ).toBeInTheDocument();
    });

    it('filters prescriptions by patient name', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by patient name or state...',
      );
      await user.type(filterInput, 'John');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('filters prescriptions by state', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by patient name or state...',
      );
      await user.type(filterInput, 'pending');

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('is case insensitive when filtering', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by patient name or state...',
      );
      await user.type(filterInput, 'JANE');

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows all prescriptions when filter is cleared', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by patient name or state...',
      );
      await user.type(filterInput, 'John');
      await user.clear(filterInput);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Navigation - Clinic context', () => {
    it('navigates to prescription detail page with clinicId from props', async () => {
      const user = userEvent.setup();
      renderExpanded({
        ...defaultProps,
        clinicId: 'clinic-prop',
        context: 'clinic',
      });

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-prop/prescriptions/rx-1?tab=prescriptions',
      );
    });

    it('navigates to prescription detail page with clinicId from route params', async () => {
      const user = userEvent.setup();
      renderExpanded({
        ...defaultProps,
        context: 'clinic',
      });

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-123/prescriptions/rx-1?tab=prescriptions',
      );
    });

    it('preserves search params in clinic context', async () => {
      const user = userEvent.setup();
      renderExpanded({
        ...defaultProps,
        context: 'clinic',
      });

      const row = screen.getByText('Jane Smith').closest('tr');
      if (row) {
        await user.click(row);
      }

      // Should preserve the "tab=prescriptions" search param
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('?tab=prescriptions'),
      );
    });
  });

  describe('Navigation - User context', () => {
    it('navigates using clinicId from prescription data', async () => {
      const user = userEvent.setup();
      renderExpanded({ ...defaultProps, context: 'user' });

      const row = screen.getByText('Jane Smith').closest('tr');
      if (row) {
        await user.click(row);
      }

      // Should use clinic-456 from the prescription, not clinic-123 from route params
      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-456/prescriptions/rx-2',
      );
    });

    it('does not preserve search params in user context', async () => {
      const user = userEvent.setup();
      renderExpanded({ ...defaultProps, context: 'user' });

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
      }

      // Should NOT have query params
      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-123/prescriptions/rx-1',
      );
    });

    it('does not navigate when prescription has no clinicId', async () => {
      const prescriptionWithoutClinic: Prescription = {
        id: 'rx-noclinic',
        clinicId: '', // Empty clinicId
        state: 'draft',
        createdTime: '2024-01-01T00:00:00Z',
        createdUserId: 'user-1',
        modifiedTime: '2024-01-01T00:00:00Z',
        modifiedUserId: 'user-1',
        latestRevision: {
          attributes: {
            firstName: 'No',
            lastName: 'Clinic',
          },
        },
      };

      const user = userEvent.setup();
      renderExpanded({
        prescriptions: [prescriptionWithoutClinic],
        totalPrescriptions: 1,
        context: 'user',
      });

      const row = screen.getByText('No Clinic').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Context defaults', () => {
    it('defaults to clinic context when not specified', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
      }

      // Should use clinic context behavior (route params + search params)
      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-123/prescriptions/rx-1?tab=prescriptions',
      );
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(defaultProps);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Prescriptions table');
    });

    it('has correct aria-label on filter input', () => {
      renderExpanded(defaultProps);

      const filterInput = screen.getByLabelText(
        'Filter prescriptions by patient name or state',
      );
      expect(filterInput).toBeInTheDocument();
    });
  });

  describe('Collapsible behavior', () => {
    it('is collapsed by default when not in a CollapsibleGroup', () => {
      render(<PrescriptionsTable {...defaultProps} />);

      // Table content should not be visible when collapsed
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('is expanded when isFirstInGroup within a CollapsibleGroup', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
