import { Pagination } from '@heroui/react';

export type TablePaginationProps = {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Whether to show the pagination range text (e.g., "Showing 1-10 of 100") */
  showRange?: boolean;
  /** Custom class name for the container */
  className?: string;
};

/**
 * Calculate the first item number on the current page
 */
function getFirstItemOnPage(
  currentPage: number,
  pageSize: number,
  totalItems: number,
): number {
  if (totalItems === 0) return 0;
  return (currentPage - 1) * pageSize + 1;
}

/**
 * Calculate the last item number on the current page
 */
function getLastItemOnPage(
  currentPage: number,
  pageSize: number,
  totalItems: number,
): number {
  return Math.min(currentPage * pageSize, totalItems);
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 25,
  onPageChange,
  showRange = false,
  className = '',
}: TablePaginationProps) {
  // Don't render if there's only one page or no items
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = getFirstItemOnPage(currentPage, pageSize, totalItems);
  const lastItem = getLastItemOnPage(currentPage, pageSize, totalItems);

  return (
    <div className={`flex flex-col items-center gap-2 mt-4 ${className}`}>
      {showRange && totalItems > 0 && (
        <span className="text-sm text-default-500">
          Showing {firstItem}-{lastItem} of {totalItems}
        </span>
      )}
      <Pagination
        page={currentPage}
        total={totalPages}
        onChange={onPageChange}
        showControls
      />
    </div>
  );
}

// Export utility functions for use in components that need pagination calculations
export { getFirstItemOnPage, getLastItemOnPage };
