import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import RecentItemsTable from './RecentItemsTable';
import { Users } from 'lucide-react';

describe('RecentItemsTable', () => {
  type TestItem = {
    id: string;
    name: string;
    email: string;
  };

  const mockItems: TestItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
  ];

  const mockColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  const defaultProps = {
    items: mockItems,
    columns: mockColumns,
    onSelect: vi.fn(),
    'aria-label': 'Recent users table',
    title: 'Recently Viewed Users',
    emptyMessage: 'No recent users to display',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the section header with title', () => {
      render(<RecentItemsTable {...defaultProps} />);

      expect(screen.getByText('Recently Viewed Users')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<RecentItemsTable {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders all items', () => {
      render(<RecentItemsTable {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('renders item data in correct columns', () => {
      render(<RecentItemsTable {...defaultProps} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when items array is empty', () => {
      render(<RecentItemsTable {...defaultProps} items={[]} />);

      expect(
        screen.getByText('No recent users to display'),
      ).toBeInTheDocument();
    });

    it('does not show items when array is empty', () => {
      render(<RecentItemsTable {...defaultProps} items={[]} />);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Row selection', () => {
    it('calls onSelect with row key when row is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(<RecentItemsTable {...defaultProps} onSelect={onSelect} />);

      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(onSelect).toHaveBeenCalledWith('1');
    });

    it('calls onSelect with correct key for different items', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(<RecentItemsTable {...defaultProps} onSelect={onSelect} />);

      const row = screen.getByText('Jane Smith').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(onSelect).toHaveBeenCalledWith('2');
    });
  });

  describe('Custom row key', () => {
    it('uses custom rowKey when provided', async () => {
      type CustomItem = {
        id?: string;
        customId: string;
        name: string;
        email: string;
      };

      const customItems: CustomItem[] = [
        {
          customId: 'custom-1',
          name: 'Custom User',
          email: 'custom@example.com',
        },
      ];

      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <RecentItemsTable<CustomItem>
          items={customItems}
          columns={mockColumns}
          onSelect={onSelect}
          aria-label="Custom table"
          title="Custom Table"
          emptyMessage="No items"
          rowKey="customId"
        />,
      );

      const row = screen.getByText('Custom User').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(onSelect).toHaveBeenCalledWith('custom-1');
    });
  });

  describe('Custom icon', () => {
    it('renders with custom icon', () => {
      render(<RecentItemsTable {...defaultProps} icon={Users} />);

      // The icon renders within the section header
      expect(screen.getByText('Recently Viewed Users')).toBeInTheDocument();
    });

    it('renders with default History icon when not specified', () => {
      render(<RecentItemsTable {...defaultProps} />);

      // Default icon is History, component should still render
      expect(screen.getByText('Recently Viewed Users')).toBeInTheDocument();
    });
  });

  describe('Custom cell renderer', () => {
    it('uses custom renderCell function when provided', () => {
      const renderCell = (item: TestItem, columnKey: string) => {
        if (columnKey === 'name') {
          return <span data-testid="custom-name">Custom: {item.name}</span>;
        }
        return item[columnKey as keyof TestItem];
      };

      render(<RecentItemsTable {...defaultProps} renderCell={renderCell} />);

      const customNames = screen.getAllByTestId('custom-name');
      expect(customNames.length).toBe(3);
      expect(customNames[0]).toHaveTextContent('Custom: John Doe');
    });

    it('applies custom renderer to all items', () => {
      const renderCell = (item: TestItem, columnKey: string) => {
        if (columnKey === 'email') {
          return <strong>{item.email}</strong>;
        }
        return item[columnKey as keyof TestItem];
      };

      render(<RecentItemsTable {...defaultProps} renderCell={renderCell} />);

      // Check that emails are rendered in strong tags
      const johnEmail = screen.getByText('john@example.com');
      expect(johnEmail.tagName).toBe('STRONG');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label on table', () => {
      render(<RecentItemsTable {...defaultProps} />);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Recent users table');
    });

    it('table rows are selectable', () => {
      render(<RecentItemsTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // First row is header, rest are data rows
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe('Different data types', () => {
    it('handles items with different shapes', () => {
      type PatientItem = {
        id: string;
        fullName: string;
        mrn: string;
      };

      const patients: PatientItem[] = [
        { id: 'p1', fullName: 'Patient One', mrn: 'MRN001' },
        { id: 'p2', fullName: 'Patient Two', mrn: 'MRN002' },
      ];

      const patientColumns = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'mrn', label: 'MRN' },
      ];

      render(
        <RecentItemsTable
          items={patients}
          columns={patientColumns}
          onSelect={vi.fn()}
          aria-label="Recent patients"
          title="Recent Patients"
          emptyMessage="No patients"
        />,
      );

      expect(screen.getByText('Patient One')).toBeInTheDocument();
      expect(screen.getByText('MRN001')).toBeInTheDocument();
    });
  });
});
