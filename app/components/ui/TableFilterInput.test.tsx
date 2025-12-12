import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test-utils';
import TableFilterInput from './TableFilterInput';

describe('TableFilterInput', () => {
  describe('basic rendering', () => {
    it('renders with default placeholder', () => {
      render(<TableFilterInput value="" onChange={() => {}} />);

      expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <TableFilterInput
          value=""
          onChange={() => {}}
          placeholder="Search clinics..."
        />,
      );

      expect(
        screen.getByPlaceholderText('Search clinics...'),
      ).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<TableFilterInput value="" onChange={() => {}} />);

      // Search icon should be aria-hidden
      const icon = document.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('displays current value', () => {
      render(<TableFilterInput value="test query" onChange={() => {}} />);

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses placeholder as aria-label by default', () => {
      render(
        <TableFilterInput
          value=""
          onChange={() => {}}
          placeholder="Filter by name..."
        />,
      );

      expect(
        screen.getByRole('textbox', { name: 'Filter by name...' }),
      ).toBeInTheDocument();
    });

    it('uses custom aria-label when provided', () => {
      render(
        <TableFilterInput
          value=""
          onChange={() => {}}
          placeholder="Filter..."
          aria-label="Search for clinics by name or ID"
        />,
      );

      expect(
        screen.getByRole('textbox', {
          name: 'Search for clinics by name or ID',
        }),
      ).toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when typing', () => {
      const handleChange = vi.fn();
      render(<TableFilterInput value="" onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(handleChange).toHaveBeenCalledWith('new value');
    });
  });

  describe('clear functionality', () => {
    it('calls onChange with empty string when cleared', () => {
      const handleChange = vi.fn();
      render(<TableFilterInput value="some text" onChange={handleChange} />);

      // HeroUI clearable input has a clear button
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith('');
    });
  });

  describe('result count display', () => {
    it('does not show result count by default', () => {
      render(
        <TableFilterInput
          value="test"
          onChange={() => {}}
          filteredCount={5}
          totalCount={10}
        />,
      );

      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });

    it('does not show result count when showResultCount is true but value is empty', () => {
      render(
        <TableFilterInput
          value=""
          onChange={() => {}}
          showResultCount={true}
          filteredCount={5}
          totalCount={10}
          itemLabel="clinics"
        />,
      );

      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });

    it('shows result count when showResultCount is true and value is not empty', () => {
      render(
        <TableFilterInput
          value="test"
          onChange={() => {}}
          showResultCount={true}
          filteredCount={5}
          totalCount={10}
          itemLabel="clinics"
        />,
      );

      expect(screen.getByText('Showing 5 of 10 clinics')).toBeInTheDocument();
    });

    it('uses default itemLabel when not provided', () => {
      render(
        <TableFilterInput
          value="test"
          onChange={() => {}}
          showResultCount={true}
          filteredCount={3}
          totalCount={15}
        />,
      );

      expect(screen.getByText('Showing 3 of 15 items')).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('renders with custom maxWidth', () => {
      render(
        <TableFilterInput
          value=""
          onChange={() => {}}
          maxWidth="w-full sm:max-w-[300px]"
        />,
      );

      // Verify the input is rendered (maxWidth is applied to Input component)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
