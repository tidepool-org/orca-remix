import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '~/test-utils';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from './TablePagination';

describe('TablePagination', () => {
  describe('basic rendering', () => {
    it('renders pagination when there are multiple pages', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
        />,
      );

      // HeroUI Pagination should be rendered
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('does not render when totalPages is 1', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={1}
          totalItems={10}
          pageSize={20}
        />,
      );

      // Should not render navigation when only 1 page
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('does not render when totalPages is 0', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={0}
          totalItems={0}
          pageSize={20}
        />,
      );

      // Should not render navigation when 0 pages
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('range display', () => {
    it('does not show range by default', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
        />,
      );

      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });

    it('shows range when showRange is true', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          showRange={true}
        />,
      );

      expect(screen.getByText('Showing 1-20 of 100')).toBeInTheDocument();
    });

    it('shows correct range for middle page', () => {
      render(
        <TablePagination
          currentPage={3}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          showRange={true}
        />,
      );

      expect(screen.getByText('Showing 41-60 of 100')).toBeInTheDocument();
    });

    it('shows correct range for last page with partial items', () => {
      render(
        <TablePagination
          currentPage={5}
          totalPages={5}
          totalItems={95}
          pageSize={20}
          showRange={true}
        />,
      );

      expect(screen.getByText('Showing 81-95 of 95')).toBeInTheDocument();
    });

    it('does not show range when totalItems is 0', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={0}
          totalItems={0}
          pageSize={20}
          showRange={true}
        />,
      );

      // Component should not render navigation when 0 pages
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });
  });

  describe('page change callback', () => {
    it('calls onPageChange when a page is clicked', () => {
      const onPageChange = vi.fn();

      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          onPageChange={onPageChange}
        />,
      );

      // Click on page 2 (HeroUI uses "pagination item 2" as aria-label)
      const page2Button = screen.getByRole('button', {
        name: /pagination item 2/i,
      });
      fireEvent.click(page2Button);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with next page on next button click', () => {
      const onPageChange = vi.fn();

      render(
        <TablePagination
          currentPage={2}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          onPageChange={onPageChange}
        />,
      );

      // Click next button
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with previous page on prev button click', () => {
      const onPageChange = vi.fn();

      render(
        <TablePagination
          currentPage={3}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          onPageChange={onPageChange}
        />,
      );

      // Click previous button
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(
        <TablePagination
          currentPage={1}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          className="custom-class"
        />,
      );

      const container = screen.getByRole('navigation').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('default pageSize', () => {
    it('uses default pageSize of 25', () => {
      render(
        <TablePagination
          currentPage={2}
          totalPages={4}
          totalItems={100}
          showRange={true}
        />,
      );

      // Page 2 with 25 items per page should show 26-50
      expect(screen.getByText('Showing 26-50 of 100')).toBeInTheDocument();
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
