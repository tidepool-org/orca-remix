import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '~/test-utils';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from './TablePagination';

describe('TablePagination', () => {
  describe('Rendering', () => {
    it('renders nothing when totalPages is 1', () => {
      render(
        <TablePagination currentPage={1} totalPages={1} totalItems={10} />,
      );
      expect(
        screen.queryByRole('button', { name: /previous page/i }),
      ).not.toBeInTheDocument();
    });

    it('renders nothing when totalPages is 0', () => {
      render(<TablePagination currentPage={1} totalPages={0} totalItems={0} />);
      expect(
        screen.queryByRole('button', { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it('renders Prev and Next buttons', () => {
      render(
        <TablePagination currentPage={2} totalPages={5} totalItems={100} />,
      );
      expect(
        screen.getByRole('button', { name: /previous page/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /next page/i }),
      ).toBeInTheDocument();
    });

    it('renders a jump-to-page input', () => {
      render(
        <TablePagination currentPage={1} totalPages={5} totalItems={100} />,
      );
      expect(screen.getByLabelText('Jump to page')).toBeInTheDocument();
    });

    it('renders range text when showRange and totalItems > 0', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          showRange
        />,
      );
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText(/1-20/)).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('does not render range text when showRange is false', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
        />,
      );
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('applies a custom className to the wrapper', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          className="custom-class"
        />,
      );
      // Wrapper is the nearest ancestor div of the Prev button that carries
      // the join of layout + caller className.
      const prev = screen.getByRole('button', { name: /previous page/i });
      const wrapper = prev.closest('.custom-class');
      expect(wrapper).not.toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('disables Prev at page 1', () => {
      render(
        <TablePagination currentPage={1} totalPages={5} totalItems={100} />,
      );
      expect(
        screen.getByRole('button', { name: /previous page/i }),
      ).toBeDisabled();
    });

    it('disables Next at totalPages', () => {
      render(
        <TablePagination currentPage={5} totalPages={5} totalItems={100} />,
      );
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('calls onPageChange(currentPage - 1) when Prev is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={3}
          totalPages={5}
          totalItems={100}
          onPageChange={onPageChange}
        />,
      );
      await user.click(screen.getByRole('button', { name: /previous page/i }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange(currentPage + 1) when Next is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={2}
          totalPages={5}
          totalItems={100}
          onPageChange={onPageChange}
        />,
      );
      await user.click(screen.getByRole('button', { name: /next page/i }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with parsed page on Enter in the jump input', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={1}
          totalPages={100}
          totalItems={2500}
          onPageChange={onPageChange}
        />,
      );
      const input = screen.getByLabelText('Jump to page');
      await user.clear(input);
      await user.type(input, '50{Enter}');
      expect(onPageChange).toHaveBeenCalledWith(50);
    });

    it('clamps over-range input to totalPages', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={1}
          totalPages={10}
          totalItems={250}
          onPageChange={onPageChange}
        />,
      );
      const input = screen.getByLabelText('Jump to page');
      await user.clear(input);
      await user.type(input, '999{Enter}');
      expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('clamps under-range input to 1', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={5}
          totalPages={10}
          totalItems={250}
          onPageChange={onPageChange}
        />,
      );
      const input = screen.getByLabelText('Jump to page');
      await user.clear(input);
      await user.type(input, '-5{Enter}');
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('does not call onPageChange when blur leaves value at currentPage', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={3}
          totalPages={10}
          totalItems={250}
          onPageChange={onPageChange}
        />,
      );
      const input = screen.getByLabelText('Jump to page');
      await user.click(input);
      await user.tab();
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('calls onPageChange on blur when value changed to a valid page', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <TablePagination
          currentPage={3}
          totalPages={10}
          totalItems={250}
          onPageChange={onPageChange}
        />,
      );
      const input = screen.getByLabelText('Jump to page');
      await user.clear(input);
      await user.type(input, '7');
      await user.tab();
      expect(onPageChange).toHaveBeenCalledWith(7);
    });
  });
});

describe('utility functions', () => {
  describe('getFirstItemOnPage', () => {
    it('returns 1 for first page', () => {
      expect(getFirstItemOnPage(1, 25, 100)).toBe(1);
    });

    it('returns correct value for second page', () => {
      expect(getFirstItemOnPage(2, 25, 100)).toBe(26);
    });

    it('returns correct value for third page', () => {
      expect(getFirstItemOnPage(3, 20, 100)).toBe(41);
    });

    it('returns 0 for empty list', () => {
      expect(getFirstItemOnPage(1, 25, 0)).toBe(0);
    });
  });

  describe('getLastItemOnPage', () => {
    it('returns pageSize for first full page', () => {
      expect(getLastItemOnPage(1, 25, 100)).toBe(25);
    });

    it('returns correct value for middle page', () => {
      expect(getLastItemOnPage(2, 25, 100)).toBe(50);
    });

    it('returns totalItems for partial last page', () => {
      expect(getLastItemOnPage(5, 25, 110)).toBe(110);
    });

    it('returns totalItems when less than pageSize', () => {
      expect(getLastItemOnPage(1, 25, 10)).toBe(10);
    });

    it('returns 0 for empty list', () => {
      expect(getLastItemOnPage(1, 25, 0)).toBe(0);
    });
  });
});
