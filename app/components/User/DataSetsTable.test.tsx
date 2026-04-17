import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import DataSetsTable from './DataSetsTable';
import { CollapsibleGroup } from '~/components/ui/CollapsibleGroup';
import type { DataSet } from './types';
import type { ResourceState } from '~/api.types';

// Mock toast context
const mockShowToast = vi.fn();
vi.mock('~/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useFetcher
const mockSubmit = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useFetcher: () => ({
      submit: mockSubmit,
      state: 'idle',
      data: null,
    }),
  };
});

// Helper to render expanded
const renderExpanded = (props: React.ComponentProps<typeof DataSetsTable>) => {
  return render(
    <CollapsibleGroup>
      <DataSetsTable {...props} isFirstInGroup />
    </CollapsibleGroup>,
  );
};

describe('DataSetsTable', () => {
  const normalDataSet: DataSet = {
    uploadId: 'upload-abc123def456',
    deviceModel: 'Omnipod 5',
    deviceManufacturers: ['Insulet'],
    deviceSerialNumber: 'SN-12345',
    dataSetType: 'normal',
    time: '2024-03-01T14:30:00Z',
    byUser: 'user-uploader-id',
    version: '2.18.0',
    deviceTags: ['insulin-pump'],
  };

  const continuousDataSet: DataSet = {
    uploadId: 'upload-xyz789ghi012',
    deviceModel: 'Dexcom G7',
    deviceManufacturers: ['Dexcom'],
    dataSetType: 'continuous',
    time: '2024-02-15T08:00:00Z',
    version: '1.5.0',
  };

  const defaultProps = {
    dataSets: [normalDataSet, continuousDataSet],
    totalDataSets: 2,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      render(<DataSetsTable {...defaultProps} />);
      expect(screen.getByText('Data Uploads (2)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Upload ID')).toBeInTheDocument();
      expect(screen.getByText('Device')).toBeInTheDocument();
      expect(screen.getByText('Manufacturer')).toBeInTheDocument();
      expect(screen.getByText('Upload Type')).toBeInTheDocument();
      expect(screen.getByText('Upload Time')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders device model and serial number', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.getByText('SN: SN-12345')).toBeInTheDocument();
    });

    it('renders upload type chips', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('normal')).toBeInTheDocument();
      expect(screen.getByText('continuous')).toBeInTheDocument();
    });

    it('renders device tags', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('insulin-pump')).toBeInTheDocument();
    });
  });

  describe('Client-side filtering', () => {
    it('renders filter input', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByPlaceholderText(
          'Filter by Upload ID, Device, or Serial...',
        ),
      ).toBeInTheDocument();
    });

    it('filters by device model', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'Omnipod');

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();
    });

    it('filters by serial number', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'SN-12345');

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();
    });

    it('filters by upload ID', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'xyz789');

      expect(screen.queryByText('Omnipod 5')).not.toBeInTheDocument();
      expect(screen.getByText('Dexcom G7')).toBeInTheDocument();
    });

    it('shows all datasets when filter is cleared', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'Omnipod');
      await user.clear(filterInput);

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.getByText('Dexcom G7')).toBeInTheDocument();
    });
  });

  describe('Delete actions', () => {
    // NOTE: Dropdown interaction tests (opening dropdown, clicking menu items)
    // are skipped because HeroUI Dropdown + React Aria's useFocusVisible
    // causes infinite recursion in jsdom when menu items receive focus.
    // These interactions should be covered by E2E tests instead.

    it('renders action buttons for each dataset', () => {
      renderExpanded(defaultProps);

      const actionButtons = screen.getAllByRole('button', {
        name: /dataset actions/i,
      });
      expect(actionButtons).toHaveLength(2);
    });
  });

  describe('Error state', () => {
    it('shows error message when dataSetsState has error', () => {
      const errorState: ResourceState<DataSet[]> = {
        status: 'error',
        error: { message: 'Failed to load data uploads' },
      };

      renderExpanded({
        dataSets: [],
        totalDataSets: 0,
        dataSetsState: errorState,
      });

      expect(
        screen.getByText('Failed to load data uploads'),
      ).toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no data sets', () => {
      renderExpanded({
        dataSets: [],
        totalDataSets: 0,
      });

      expect(screen.getByText('No data uploads found')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderExpanded({
        dataSets: [],
        totalDataSets: 0,
        isLoading: true,
      });

      expect(screen.getByText('Loading data uploads...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(defaultProps);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Data uploads table');
    });

    it('has correct aria-label on filter input', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByLabelText('Filter uploads by Upload ID, Device, or Serial'),
      ).toBeInTheDocument();
    });
  });

  describe('Collapsible behavior', () => {
    it('is collapsed by default when not in a CollapsibleGroup', () => {
      render(<DataSetsTable {...defaultProps} />);
      expect(screen.queryByText('Omnipod 5')).not.toBeInTheDocument();
    });

    it('is expanded when isFirstInGroup within a CollapsibleGroup', () => {
      renderExpanded(defaultProps);
      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
    });
  });
});
