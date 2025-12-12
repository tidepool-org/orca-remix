import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test-utils';
import ProfileHeader from './ProfileHeader';

describe('ProfileHeader', () => {
  describe('basic rendering', () => {
    it('renders the title', () => {
      render(<ProfileHeader title="Test Title" />);

      expect(
        screen.getByRole('heading', { name: 'Test Title' }),
      ).toBeInTheDocument();
    });

    it('renders without identifiers or detail fields', () => {
      render(<ProfileHeader title="Simple Header" />);

      expect(screen.getByText('Simple Header')).toBeInTheDocument();
    });
  });

  describe('identifiers', () => {
    it('renders identifiers with labels', () => {
      render(
        <ProfileHeader
          title="Test"
          identifiers={[{ label: 'ID:', value: '12345', monospace: true }]}
        />,
      );

      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('renders identifiers without labels', () => {
      render(
        <ProfileHeader
          title="Test"
          identifiers={[{ value: 'test@example.com' }]}
        />,
      );

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders multiple identifiers', () => {
      render(
        <ProfileHeader
          title="Test"
          identifiers={[
            { value: 'user@example.com' },
            { label: 'ID:', value: 'abc123', monospace: true },
            { label: 'MRN:', value: 'MRN-001', monospace: true },
          ]}
        />,
      );

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('abc123')).toBeInTheDocument();
      expect(screen.getByText('MRN:')).toBeInTheDocument();
      expect(screen.getByText('MRN-001')).toBeInTheDocument();
    });

    it('renders clipboard buttons for identifiers', () => {
      render(
        <ProfileHeader
          title="Test"
          identifiers={[{ value: 'copyable-value' }]}
        />,
      );

      // ClipboardButton should be rendered
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('action link', () => {
    it('renders the action link when provided', () => {
      const ActionLink = <a href="/somewhere">View Details</a>;

      render(<ProfileHeader title="Test" actionLink={ActionLink} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  describe('title row extra', () => {
    it('renders titleRowExtra content next to the title', () => {
      const Extra = <span data-testid="extra-content">Extra Info</span>;

      render(<ProfileHeader title="Test" titleRowExtra={Extra} />);

      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    });
  });

  describe('detail fields and expansion', () => {
    const detailFields = [
      { label: 'Status', value: 'Active' },
      { label: 'Created', value: '2024-01-01' },
      { label: 'Role', value: 'Admin' },
    ];

    it('renders details toggle button when detail fields are provided', () => {
      render(<ProfileHeader title="Test" detailFields={detailFields} />);

      const toggleButton = screen.getByRole('button', {
        name: /show details/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });

    it('does not render details toggle button when no detail fields', () => {
      render(<ProfileHeader title="Test" />);

      expect(
        screen.queryByRole('button', { name: /show details/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /hide details/i }),
      ).not.toBeInTheDocument();
    });

    it('hides detail fields by default', () => {
      render(<ProfileHeader title="Test" detailFields={detailFields} />);

      expect(screen.queryByText('Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('shows detail fields when toggle button is clicked', () => {
      render(<ProfileHeader title="Test" detailFields={detailFields} />);

      const toggleButton = screen.getByRole('button', {
        name: /show details/i,
      });
      fireEvent.click(toggleButton);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('hides detail fields when toggle button is clicked twice', () => {
      render(<ProfileHeader title="Test" detailFields={detailFields} />);

      const toggleButton = screen.getByRole('button', {
        name: /show details/i,
      });
      fireEvent.click(toggleButton);

      // Now details should be visible
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Click again to hide
      const hideButton = screen.getByRole('button', { name: /hide details/i });
      fireEvent.click(hideButton);

      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('starts expanded when defaultExpanded is true', () => {
      render(
        <ProfileHeader
          title="Test"
          detailFields={detailFields}
          defaultExpanded={true}
        />,
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('calls onExpandedChange callback when expansion state changes', () => {
      const onExpandedChange = vi.fn();

      render(
        <ProfileHeader
          title="Test"
          detailFields={detailFields}
          onExpandedChange={onExpandedChange}
        />,
      );

      const toggleButton = screen.getByRole('button', {
        name: /show details/i,
      });
      fireEvent.click(toggleButton);

      expect(onExpandedChange).toHaveBeenCalledWith(true);

      const hideButton = screen.getByRole('button', { name: /hide details/i });
      fireEvent.click(hideButton);

      expect(onExpandedChange).toHaveBeenCalledWith(false);
    });

    it('renders detail fields with ReactNode values', () => {
      const detailFieldsWithNode = [
        {
          label: 'Tags',
          value: (
            <div data-testid="tags-container">
              <span>Tag1</span>
              <span>Tag2</span>
            </div>
          ),
        },
      ];

      render(
        <ProfileHeader
          title="Test"
          detailFields={detailFieldsWithNode}
          defaultExpanded={true}
        />,
      );

      expect(screen.getByTestId('tags-container')).toBeInTheDocument();
      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
    });
  });
});
