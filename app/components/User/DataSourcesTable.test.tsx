import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import DataSourcesTable from './DataSourcesTable';
import { CollapsibleGroup } from '~/components/ui/CollapsibleGroup';
import type { DataSource, ConnectionRequest } from './types';
import type { ResourceState } from '~/api.types';

// Mock toast context
const mockShowToast = vi.fn();
vi.mock('~/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useFetcher — keyed fetchers
const mockDisconnectSubmit = vi.fn();
const mockInviteSubmit = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ userId: 'user-123' }),
    useFetcher: ({ key }: { key?: string } = {}) => {
      if (key === 'disconnect-data-source') {
        return {
          submit: mockDisconnectSubmit,
          state: 'idle',
          data: null,
        };
      }
      if (key === 'send-connect-request') {
        return {
          submit: mockInviteSubmit,
          state: 'idle',
          data: null,
        };
      }
      return { submit: vi.fn(), state: 'idle', data: null };
    },
  };
});

// Helper to render expanded
const renderExpanded = (
  props: React.ComponentProps<typeof DataSourcesTable>,
) => {
  return render(
    <CollapsibleGroup>
      <DataSourcesTable {...props} isFirstInGroup />
    </CollapsibleGroup>,
  );
};

describe('DataSourcesTable', () => {
  const connectedSource: DataSource = {
    dataSourceId: 'ds-1',
    providerName: 'dexcom',
    state: 'connected',
    createdTime: '2024-01-15T10:00:00Z',
    modifiedTime: '2024-01-15T10:00:00Z',
    lastImportTime: '2024-03-01T08:00:00Z',
    latestDataTime: '2024-03-01T07:00:00Z',
    earliestDataTime: '2023-06-01T00:00:00Z',
  };

  const disconnectedSource: DataSource = {
    dataSourceId: 'ds-2',
    providerName: 'abbott',
    state: 'disconnected',
    createdTime: '2024-02-01T12:00:00Z',
    modifiedTime: '2024-02-10T12:00:00Z',
  };

  const defaultProps = {
    dataSources: [connectedSource, disconnectedSource],
    totalDataSources: 2,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with title and count', () => {
      render(<DataSourcesTable {...defaultProps} />);
      expect(screen.getByText('Data Sources (2)')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders provider names', () => {
      renderExpanded(defaultProps);

      expect(screen.getByText('dexcom')).toBeInTheDocument();
      expect(screen.getByText('abbott')).toBeInTheDocument();
    });
  });

  describe('Merged connection requests', () => {
    it('shows synthetic entries for connection requests without existing sources', () => {
      const connectionRequests: ConnectionRequest[] = [
        { providerName: 'twiist', createdTime: '2024-03-01T00:00:00Z' },
      ];

      renderExpanded({
        ...defaultProps,
        connectionRequests,
      });

      // twiist should appear as a synthetic entry
      expect(screen.getByText('twiist')).toBeInTheDocument();
    });

    it('does not duplicate providers that already have a data source', () => {
      const connectionRequests: ConnectionRequest[] = [
        { providerName: 'dexcom', createdTime: '2024-03-01T00:00:00Z' },
      ];

      renderExpanded({
        ...defaultProps,
        connectionRequests,
      });

      // dexcom should appear only once (from the data source, not the connection request)
      const dexcomCells = screen.getAllByText('dexcom');
      expect(dexcomCells).toHaveLength(1);
    });
  });

  describe('Action buttons', () => {
    it('shows Disconnect button for connected sources', () => {
      renderExpanded(defaultProps);

      expect(
        screen.getByRole('button', { name: /disconnect dexcom/i }),
      ).toBeInTheDocument();
    });

    it('does not show Send Invite for disconnected sources without clinic context', () => {
      renderExpanded(defaultProps);

      // No clinicId prop, so no invite buttons
      expect(
        screen.queryByRole('button', { name: /send invite/i }),
      ).not.toBeInTheDocument();
    });

    it('shows Send Invite for disconnected sources with clinic context and email', () => {
      renderExpanded({
        ...defaultProps,
        clinicId: 'clinic-1',
        patientHasEmail: true,
      });

      expect(
        screen.getByRole('button', { name: /send invite for abbott/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Available provider invite buttons', () => {
    it('shows invite buttons for providers not yet connected', () => {
      renderExpanded({
        dataSources: [connectedSource], // only dexcom connected
        totalDataSources: 1,
        clinicId: 'clinic-1',
        patientHasEmail: true,
      });

      // twiist and abbott should be available for invites
      expect(
        screen.getByRole('button', {
          name: /send connection invite for twiist/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /send connection invite for abbott/i,
        }),
      ).toBeInTheDocument();
    });

    it('does not show invite buttons without clinic context', () => {
      renderExpanded({
        dataSources: [connectedSource],
        totalDataSources: 1,
        patientHasEmail: true,
        // no clinicId
      });

      expect(
        screen.queryByRole('button', {
          name: /send connection invite/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Disconnect modal', () => {
    it('opens confirmation modal and submits disconnect', async () => {
      const user = userEvent.setup();
      renderExpanded(defaultProps);

      await user.click(
        screen.getByRole('button', { name: /disconnect dexcom/i }),
      );

      expect(screen.getByText('Disconnect Data Source')).toBeInTheDocument();
      expect(
        screen.getByText(/disconnect the dexcom data source/i),
      ).toBeInTheDocument();

      // Confirm disconnect
      await user.click(screen.getByRole('button', { name: /^disconnect$/i }));

      expect(mockDisconnectSubmit).toHaveBeenCalledWith(
        expect.any(FormData),
        expect.objectContaining({ method: 'post' }),
      );
    });
  });

  describe('Error state', () => {
    it('shows error message when dataSourcesState has error', () => {
      const errorState: ResourceState<DataSource[]> = {
        status: 'error',
        error: { message: 'Failed to load data sources' },
      };

      renderExpanded({
        dataSources: [],
        totalDataSources: 0,
        dataSourcesState: errorState,
      });

      expect(
        screen.getByText('Failed to load data sources'),
      ).toBeInTheDocument();
    });
  });

  describe('Empty and loading states', () => {
    it('shows empty message when no data sources', () => {
      renderExpanded({
        dataSources: [],
        totalDataSources: 0,
      });

      expect(screen.getByText('No data sources found')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderExpanded({
        dataSources: [],
        totalDataSources: 0,
        isLoading: true,
      });

      expect(screen.getByText('Loading data sources...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      renderExpanded(defaultProps);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Data sources table');
    });
  });
});
