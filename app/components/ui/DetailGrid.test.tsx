import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import DetailGrid from './DetailGrid';

describe('DetailGrid', () => {
  describe('Basic Rendering', () => {
    it('renders fields with labels and values', () => {
      render(
        <DetailGrid
          fields={[
            { label: 'Name', value: 'John Doe' },
            { label: 'Email', value: 'john@example.com' },
          ]}
        />,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders ReactNode values', () => {
      render(
        <DetailGrid
          fields={[
            {
              label: 'Status',
              value: <span data-testid="custom-status">Active</span>,
            },
          ]}
        />,
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByTestId('custom-status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders the correct number of fields', () => {
      render(
        <DetailGrid
          fields={[
            { label: 'Field 1', value: 'Value 1' },
            { label: 'Field 2', value: 'Value 2' },
            { label: 'Field 3', value: 'Value 3' },
          ]}
        />,
      );

      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(screen.getByText('Field 2')).toBeInTheDocument();
      expect(screen.getByText('Field 3')).toBeInTheDocument();
    });
  });

  describe('Hidden Fields', () => {
    it('does not render hidden fields', () => {
      render(
        <DetailGrid
          fields={[
            { label: 'Visible', value: 'I am visible' },
            { label: 'Hidden', value: 'I am hidden', hidden: true },
          ]}
        />,
      );

      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.getByText('I am visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
      expect(screen.queryByText('I am hidden')).not.toBeInTheDocument();
    });

    it('returns null when all fields are hidden', () => {
      const { container } = render(
        <DetailGrid
          fields={[
            { label: 'Hidden 1', value: 'Value 1', hidden: true },
            { label: 'Hidden 2', value: 'Value 2', hidden: true },
          ]}
        />,
      );

      // DetailGrid returns null, but HeroUI provider wraps with overlay container
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeNull();
    });

    it('returns null when fields array is empty', () => {
      const { container } = render(<DetailGrid fields={[]} />);

      // DetailGrid returns null, but HeroUI provider wraps with overlay container
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeNull();
    });
  });

  describe('Grid Layout', () => {
    it('applies grid class to the container', () => {
      const { container } = render(
        <DetailGrid fields={[{ label: 'Test', value: 'Value' }]} />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
    });

    it('applies text-sm class to the container', () => {
      const { container } = render(
        <DetailGrid fields={[{ label: 'Test', value: 'Value' }]} />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('text-sm');
    });

    it('applies default column gap', () => {
      const { container } = render(
        <DetailGrid fields={[{ label: 'Test', value: 'Value' }]} />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('gap-x-4');
    });

    it('applies default row gap', () => {
      const { container } = render(
        <DetailGrid fields={[{ label: 'Test', value: 'Value' }]} />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('gap-y-2');
    });

    it('applies custom column gap', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          columnGap="gap-x-8"
        />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('gap-x-8');
    });

    it('applies custom row gap', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          rowGap="gap-y-4"
        />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('gap-y-4');
    });
  });

  describe('Responsive Columns', () => {
    it('applies default column classes', () => {
      const { container } = render(
        <DetailGrid fields={[{ label: 'Test', value: 'Value' }]} />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-2');
      expect(gridElement).toHaveClass('sm:grid-cols-2');
      expect(gridElement).toHaveClass('md:grid-cols-3');
      expect(gridElement).toHaveClass('lg:grid-cols-4');
    });

    it('applies custom column configuration', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          columns={{ default: 1, sm: 2, md: 3 }}
        />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('sm:grid-cols-2');
      expect(gridElement).toHaveClass('md:grid-cols-3');
    });

    it('handles partial column configuration', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          columns={{ default: 1 }}
        />,
      );

      const gridElement = container.querySelector('.grid');
      expect(gridElement).toHaveClass('grid-cols-1');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the container', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          className="my-custom-class"
        />,
      );

      const gridElement = container.querySelector('.my-custom-class');
      expect(gridElement).toBeInTheDocument();
    });

    it('preserves default classes when adding custom className', () => {
      const { container } = render(
        <DetailGrid
          fields={[{ label: 'Test', value: 'Value' }]}
          className="my-custom-class"
        />,
      );

      const gridElement = container.querySelector('.my-custom-class');
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('text-sm');
      expect(gridElement).toHaveClass('my-custom-class');
    });
  });

  describe('Field Styling', () => {
    it('applies correct label styling', () => {
      render(<DetailGrid fields={[{ label: 'My Label', value: 'Value' }]} />);

      const label = screen.getByText('My Label');
      expect(label).toHaveClass('text-default-400');
      expect(label).toHaveClass('block');
      expect(label).toHaveClass('text-xs');
    });

    it('applies correct value styling', () => {
      render(<DetailGrid fields={[{ label: 'Label', value: 'My Value' }]} />);

      const value = screen.getByText('My Value');
      expect(value).toHaveClass('text-default-600');
    });
  });

  describe('Complex Field Values', () => {
    it('renders links as values', () => {
      render(
        <DetailGrid
          fields={[
            {
              label: 'Website',
              value: <a href="https://example.com">Visit Site</a>,
            },
          ]}
        />,
      );

      const link = screen.getByRole('link', { name: 'Visit Site' });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders multiple elements as value', () => {
      render(
        <DetailGrid
          fields={[
            {
              label: 'Tags',
              value: (
                <div>
                  <span>Tag 1</span>
                  <span>Tag 2</span>
                </div>
              ),
            },
          ]}
        />,
      );

      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
    });
  });
});
