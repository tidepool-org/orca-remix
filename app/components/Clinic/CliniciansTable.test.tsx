import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import CliniciansTable from './CliniciansTable';
import { CollapsibleGroup } from '~/components/ui/CollapsibleGroup';
import type { Clinician } from './types';
import type { ResourceState } from '~/api.types';

// Helper to render CliniciansTable in expanded state
const renderExpanded = (
  props: React.ComponentProps<typeof CliniciansTable>,
) => {
  return render(
    <CollapsibleGroup>
      <CliniciansTable {...props} isFirstInGroup />
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
    useHref: (to: string) => to,
  };
});

describe('CliniciansTable', () => {
  const mockClinicians: Clinician[] = [
    {
      id: 'clin-1',
      name: 'Dr. Alice Smith',
      email: 'alice@clinic.com',
      roles: ['CLINIC_ADMIN'],
      createdTime: '2024-01-15T10:00:00Z',
      updatedTime: '2024-01-15T10:00:00Z',
    },
    {
      id: 'clin-2',
      name: 'Nurse Bob Jones',
      email: 'bob@clinic.com',
      roles: ['CLINIC_MEMBER'],
      createdTime: '2024-02-20T14:00:00Z',
      updatedTime: '2024-02-20T14:00:00Z',
    },
  ];

  const defaultProps = {
    clinicians: mockClinicians,
    totalClinicians: mockClinicians.length,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      render(<CliniciansTable {...defaultProps} />);
      expect(screen.getByText('Clinicians')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Clinician Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Added')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders clinician data', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Nurse Bob Jones')).toBeInTheDocument();
    });

    it('renders role chip with admin styling', () => {
      renderExpanded(defaultProps);

      // CLINIC_ADMIN should be stripped to "admin"
      expect(screen.getByText('admin')).toBeInTheDocument();
      // CLINIC_MEMBER should be stripped to "member"
      expect(screen.getByText('member')).toBeInTheDocument();
    });
  });

  describe('Remove clinician', () => {
    it('opens confirmation modal on remove button click', async () => {
      const user = userEvent.setup();
      const onRemoveClinician = vi.fn();
      renderExpanded({ ...defaultProps, onRemoveClinician });

      // Click first remove button
      const removeButtons = screen.getAllByRole('button', {
        name: /remove clinician/i,
      });
      await user.click(removeButtons[0]);

      // Modal should open with title and description
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByText(/remove Dr. Alice Smith from this clinic/i),
      ).toBeInTheDocument();
    });

    it('calls onRemoveClinician with correct ID on confirm', async () => {
      const user = userEvent.setup();
      const onRemoveClinician = vi.fn();
      renderExpanded({ ...defaultProps, onRemoveClinician });

      // Click first remove button
      const removeButtons = screen.getAllByRole('button', {
        name: /remove clinician/i,
      });
      await user.click(removeButtons[0]);

      // Confirm in modal
      await user.click(
        screen.getByRole('button', { name: /^remove clinician$/i }),
      );

      expect(onRemoveClinician).toHaveBeenCalledWith('clin-1');
    });

    it('disables remove buttons when onRemoveClinician is not provided', () => {
      renderExpanded(defaultProps);

      const removeButtons = screen.getAllByRole('button', {
        name: /remove clinician/i,
      });
      removeButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to clinician detail page on row click', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const row = screen.getByText('Dr. Alice Smith').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-123/clinicians/clin-1',
      );
    });
  });

  describe('Error state', () => {
    it('shows the error instead of the table', () => {
      const errorState: ResourceState<Clinician[]> = {
        status: 'error',
        error: { message: 'Failed to load' },
      };

      renderExpanded({
        clinicians: [],
        totalClinicians: 0,
        cliniciansState: errorState,
      });

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no clinicians', () => {
      renderExpanded({
        clinicians: [],
        totalClinicians: 0,
      });

      expect(
        screen.getByText('No clinicians found for this clinic'),
      ).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderExpanded({
        clinicians: [],
        totalClinicians: 0,
        isLoading: true,
      });

      expect(screen.getByText('Loading clinicians...')).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('renders search input', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByPlaceholderText('Search clinicians...'),
      ).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    const sortStates = () =>
      screen
        .getAllByRole('columnheader')
        .map((header) => header.getAttribute('aria-sort'));

    it('reports +roles when the Role header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      renderExpanded({ ...defaultProps, onSort });

      await user.click(screen.getByRole('columnheader', { name: /role/i }));

      expect(onSort).toHaveBeenCalledWith('+roles');
    });

    it('reports -roles when Role is clicked while already ascending', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      renderExpanded({ ...defaultProps, onSort, currentSort: '+roles' });

      await user.click(screen.getByRole('columnheader', { name: /role/i }));

      expect(onSort).toHaveBeenCalledWith('-roles');
    });

    it('reports -createdTime on the first Added click', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      renderExpanded({ ...defaultProps, onSort, currentSort: '+roles' });

      await user.click(screen.getByRole('columnheader', { name: /added/i }));

      expect(onSort).toHaveBeenCalledWith('-createdTime');
    });

    it('reports +createdTime when Added is clicked while descending', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      renderExpanded({ ...defaultProps, onSort, currentSort: '-createdTime' });

      await user.click(screen.getByRole('columnheader', { name: /added/i }));

      expect(onSort).toHaveBeenCalledWith('+createdTime');
    });

    it('marks the Added header descending for -createdTime', () => {
      renderExpanded({ ...defaultProps, currentSort: '-createdTime' });

      expect(
        screen.getByRole('columnheader', { name: /added/i }),
      ).toHaveAttribute('aria-sort', 'descending');
      expect(
        sortStates().filter((s) => s === 'ascending' || s === 'descending'),
      ).toHaveLength(1);
    });

    it('marks no header sorted when no currentSort is given', () => {
      renderExpanded(defaultProps);

      expect(sortStates()).not.toContain('ascending');
      expect(sortStates()).not.toContain('descending');
    });

    it('leaves the Actions header without a sort state', () => {
      renderExpanded({ ...defaultProps, currentSort: '+roles' });

      expect(
        screen.getByRole('columnheader', { name: /actions/i }),
      ).not.toHaveAttribute('aria-sort');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(defaultProps);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Clinic clinicians table');
    });
  });

  describe('Collapsible behavior', () => {
    it('is collapsed by default when not in a CollapsibleGroup', () => {
      render(<CliniciansTable {...defaultProps} />);
      expect(screen.queryByText('Dr. Alice Smith')).not.toBeInTheDocument();
    });

    it('is expanded when isFirstInGroup within a CollapsibleGroup', () => {
      renderExpanded(defaultProps);
      expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
    });
  });
});
