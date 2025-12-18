import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '~/test-utils';
import userEvent from '@testing-library/user-event';
import DebouncedSearchInput from './DebouncedSearchInput';

describe('DebouncedSearchInput', () => {
  describe('Rendering', () => {
    it('renders an input field', () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} />);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      const onSearch = vi.fn();
      render(
        <DebouncedSearchInput
          onSearch={onSearch}
          placeholder="Find patients..."
        />,
      );

      expect(
        screen.getByPlaceholderText('Find patients...'),
      ).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} value="initial" />);

      expect(screen.getByRole('textbox')).toHaveValue('initial');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label matching placeholder', () => {
      const onSearch = vi.fn();
      render(
        <DebouncedSearchInput onSearch={onSearch} placeholder="Search users" />,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-label',
        'Search users',
      );
    });

    it('has default aria-label', () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} />);

      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-label',
        'Search...',
      );
    });

    it('is focusable', async () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      await act(async () => {
        input.focus();
      });

      expect(input).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('updates local value on input', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('test');
    });
  });

  describe('Clear functionality', () => {
    it('renders a clearable input', () => {
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} value="initial" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');

      // HeroUI Input with isClearable shows a clear button
      const clearButton = screen.getByRole('button', { hidden: true });
      expect(clearButton).toBeInTheDocument();
    });

    it('clears the input value when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<DebouncedSearchInput onSearch={onSearch} value="initial" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');

      const clearButton = screen.getByRole('button', { hidden: true });
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('Value prop synchronization', () => {
    it('updates local value when value prop changes', async () => {
      const onSearch = vi.fn();
      const { rerender } = render(
        <DebouncedSearchInput onSearch={onSearch} value="initial" />,
      );

      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<DebouncedSearchInput onSearch={onSearch} value="updated" />);

      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });

    it('preserves empty value when value prop is empty', async () => {
      const onSearch = vi.fn();
      const { rerender } = render(
        <DebouncedSearchInput onSearch={onSearch} value="initial" />,
      );

      rerender(<DebouncedSearchInput onSearch={onSearch} value="" />);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });
});
