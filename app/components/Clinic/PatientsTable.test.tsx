import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import PatientsTable from './PatientsTable';
import { CollapsibleGroup } from '~/components/CollapsibleGroup';
import type { Patient } from './types';

// Helper to render PatientsTable in expanded state
const renderExpanded = (props: React.ComponentProps<typeof PatientsTable>) => {
  return render(
    <CollapsibleGroup>
      <PatientsTable {...props} isFirstInGroup />
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

describe('PatientsTable', () => {
  const mockPatients: Patient[] = [
    {
      id: 'patient-1',
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      birthDate: '1990-05-15',
      mrn: 'MRN-001',
      tags: ['tag-1', 'tag-2', 'tag-3'],
      sites: [
        { id: 'site-1', name: 'Site A' },
        { id: 'site-2', name: 'Site B' },
        { id: 'site-3', name: 'Site C' },
      ],
      permissions: { custodian: {} },
      createdTime: '2024-01-10T08:00:00Z',
      updatedTime: '2024-01-10T08:00:00Z',
    },
    {
      id: 'patient-2',
      fullName: 'Bob Smith',
      birthDate: '1985-12-01',
      createdTime: '2024-02-20T10:00:00Z',
      updatedTime: '2024-02-20T10:00:00Z',
    },
  ];

  const clinic = {
    patientTags: [
      { id: 'tag-1', name: 'Type 1' },
      { id: 'tag-2', name: 'Pump User' },
      { id: 'tag-3', name: 'CGM User' },
    ],
    sites: [
      { id: 'site-1', name: 'Main Campus' },
      { id: 'site-2', name: 'Downtown' },
      { id: 'site-3', name: 'North Clinic' },
    ],
  };

  const defaultProps = {
    patients: mockPatients,
    totalPatients: mockPatients.length,
    isLoading: false,
    clinic,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the collapsible header with title and count', () => {
      render(<PatientsTable {...defaultProps} />);
      expect(screen.getByText('Patients (2)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Birth Date')).toBeInTheDocument();
      expect(screen.getByText('MRN')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Sites')).toBeInTheDocument();
      expect(screen.getByText('Added')).toBeInTheDocument();
    });

    it('renders patient data', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('renders custodial chip for custodial patients', () => {
      renderExpanded(defaultProps);
      expect(screen.getByText('Custodial')).toBeInTheDocument();
    });

    it('renders dash for missing optional fields', () => {
      renderExpanded(defaultProps);

      // Bob Smith has no email, mrn, tags, or sites
      const rows = screen.getAllByRole('row');
      const bobRow = rows.find((row) => within(row).queryByText('Bob Smith'));
      expect(bobRow).toBeDefined();
      if (bobRow) {
        const dashes = within(bobRow).getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Sort conversion', () => {
    it('converts ascending sort descriptor to +column string', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      renderExpanded({ ...defaultProps, onSort });

      // Click the Patient Name column header to trigger sort
      const nameHeader = screen.getByText('Patient Name');
      await user.click(nameHeader);

      expect(onSort).toHaveBeenCalledWith(expect.stringContaining('fullName'));
    });
  });

  describe('Tag and site overflow', () => {
    it('shows first 2 tags and a +N chip for overflow', () => {
      renderExpanded(defaultProps);

      // Alice has 3 tags — should show 2 + overflow chip
      expect(screen.getByText('Type 1')).toBeInTheDocument();
      expect(screen.getByText('Pump User')).toBeInTheDocument();
      // At least one "+1" overflow chip should exist for tags
      expect(screen.getAllByText('+1').length).toBeGreaterThanOrEqual(1);
    });

    it('shows first 2 sites and a +N chip for overflow', () => {
      renderExpanded(defaultProps);

      // Alice has 3 sites — should show 2 + overflow chip
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
      expect(screen.getByText('Downtown')).toBeInTheDocument();
      // There should be two "+1" chips (one for tags, one for sites)
      const overflowChips = screen.getAllByText('+1');
      expect(overflowChips.length).toBe(2);
    });
  });

  describe('Navigation', () => {
    it('navigates to patient detail page on row click', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const row = screen.getByText('Alice Johnson').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockNavigate).toHaveBeenCalledWith(
        '/clinics/clinic-123/patients/patient-1',
      );
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no patients', () => {
      renderExpanded({
        patients: [],
        totalPatients: 0,
      });

      expect(
        screen.getByText('No patients found for this clinic'),
      ).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      renderExpanded({
        patients: [],
        totalPatients: 0,
        isLoading: true,
      });

      expect(screen.getByText('Loading patients...')).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('renders search input', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByPlaceholderText('Search patients...'),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(defaultProps);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Clinic patients table');
    });
  });

  describe('Collapsible behavior', () => {
    it('is collapsed by default when not in a CollapsibleGroup', () => {
      render(<PatientsTable {...defaultProps} />);
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('is expanded when isFirstInGroup within a CollapsibleGroup', () => {
      renderExpanded(defaultProps);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });
});
