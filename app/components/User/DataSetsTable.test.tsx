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
      expect(screen.getByText('Data Uploads')).toBeInTheDocument();
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
          'Filter this page by Upload ID, Device, or Serial...',
        ),
      ).toBeInTheDocument();
    });

    it('states that the filter covers only the loaded page', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'Omnipod');

      expect(
        screen.getByText('Showing 1 of 2 uploads on this page'),
      ).toBeInTheDocument();
    });

    it('filters by device model', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'Omnipod');

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();
    });

    it('filters by serial number', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'SN-12345');

      expect(screen.getByText('Omnipod 5')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();
    });

    it('filters by upload ID', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
      );
      await user.type(filterInput, 'xyz789');

      expect(screen.queryByText('Omnipod 5')).not.toBeInTheDocument();
      expect(screen.getByText('Dexcom G7')).toBeInTheDocument();
    });

    it('shows all datasets when filter is cleared', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
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
        screen.getByLabelText(
          'Filter this page of uploads by Upload ID, Device, or Serial',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Friendly device names', () => {
    const friendlyDataSet: DataSet = {
      uploadId: 'upload-friendly-001',
      deviceName: 'ReliOn Platinum',
      deviceModel: '982',
      deviceManufacturers: ['Roche'],
      dataSetType: 'normal',
      time: '2024-04-01T10:00:00Z',
    };

    it('renders the platform deviceName as the heading while keeping the raw model visible', () => {
      renderExpanded({
        dataSets: [friendlyDataSet],
        totalDataSets: 1,
      });

      expect(screen.getByText('ReliOn Platinum')).toBeInTheDocument();
      // Raw model stays discoverable as subtext.
      expect(screen.getByText('982')).toBeInTheDocument();
    });

    it('labels an app-sourced (Loop) upload from client.name', () => {
      renderExpanded({
        dataSets: [
          {
            uploadId: 'upload-loop-001',
            dataSetType: 'continuous',
            time: '2024-04-01T10:00:00Z',
            deviceTags: ['insulin-pump'],
            client: { name: 'org.tidepool.Loop' },
          },
        ],
        totalDataSets: 1,
      });

      // Both the device heading and the manufacturer cell surface the service.
      expect(screen.getAllByText('Tidepool Loop').length).toBeGreaterThan(0);
    });

    it('renders the derived manufacturer + model label when no deviceName', () => {
      renderExpanded({
        dataSets: [
          {
            uploadId: 'upload-derived-001',
            deviceModel: '982',
            deviceManufacturers: ['Roche'],
            dataSetType: 'normal',
            time: '2024-04-01T10:00:00Z',
          },
        ],
        totalDataSets: 1,
      });

      expect(screen.getByText('Roche 982')).toBeInTheDocument();
    });

    it('filters by the friendly name and by the raw model', async () => {
      const user = userEvent.setup();
      renderExpanded({
        dataSets: [friendlyDataSet, continuousDataSet],
        totalDataSets: 2,
      });

      const filterInput = screen.getByPlaceholderText(
        'Filter this page by Upload ID, Device, or Serial...',
      );

      await user.type(filterInput, 'ReliOn');
      expect(screen.getByText('ReliOn Platinum')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();

      await user.clear(filterInput);
      await user.type(filterInput, '982');
      expect(screen.getByText('ReliOn Platinum')).toBeInTheDocument();
      expect(screen.queryByText('Dexcom G7')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('renders the pager when a further page exists', () => {
      renderExpanded({ ...defaultProps, hasMore: true });

      expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
    });

    it('renders no pager for a single short page', () => {
      renderExpanded(defaultProps);

      expect(
        screen.queryByRole('button', { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it('reports the requested page instead of holding one itself', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      renderExpanded({
        ...defaultProps,
        currentPage: 2,
        hasMore: true,
        onPageChange,
      });

      await user.click(screen.getByRole('button', { name: /next page/i }));
      expect(onPageChange).toHaveBeenCalledWith(3);

      await user.click(screen.getByRole('button', { name: /previous page/i }));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('presents the header count as a floor while more pages exist', () => {
      render(<DataSetsTable {...defaultProps} totalDataSets={25} hasMore />);
      expect(screen.getByText('25+ total')).toBeInTheDocument();
    });

    it('presents the header count as exact on the last page', () => {
      render(<DataSetsTable {...defaultProps} totalDataSets={25} />);
      expect(screen.getByText('25 total')).toBeInTheDocument();
    });

    it('says an empty page above the first is past the end, and keeps the pager', () => {
      renderExpanded({
        dataSets: [],
        totalDataSets: 50,
        currentPage: 3,
      });

      expect(
        screen.getByText("Page 3 is past the end of this account's uploads"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('No data uploads found'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /previous page/i }),
      ).toBeEnabled();
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
