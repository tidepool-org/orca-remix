import { Button, Input } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const clampPage = (n: number) => Math.min(Math.max(n, 1), totalPages);

  const handleJump = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return currentPage;
    return clampPage(n);
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 mt-4 pt-3 border-t border-content2 ${className}`}
    >
      {showRange && totalItems > 0 ? (
        <span className="text-xs font-mono text-default-500">
          Showing{' '}
          <b className="text-foreground/70">
            {firstItem}-{lastItem}
          </b>{' '}
          of <b className="text-foreground/70">{totalItems}</b>
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="bordered"
          isIconOnly
          aria-label="Previous page"
          isDisabled={currentPage <= 1}
          onPress={() => onPageChange?.(clampPage(currentPage - 1))}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <span className="flex items-center gap-2 text-xs font-mono text-default-500">
          Page
          <Input
            size="sm"
            aria-label="Jump to page"
            className="w-14"
            classNames={{ input: 'text-center font-mono' }}
            defaultValue={String(currentPage)}
            key={currentPage}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const target = e.currentTarget as HTMLInputElement;
              const clamped = handleJump(target.value);
              if (clamped !== currentPage) onPageChange?.(clamped);
            }}
            onBlur={(e) => {
              const clamped = handleJump(e.currentTarget.value);
              if (clamped !== currentPage) onPageChange?.(clamped);
            }}
          />
          of {totalPages}
        </span>
        <Button
          size="sm"
          variant="bordered"
          isIconOnly
          aria-label="Next page"
          isDisabled={currentPage >= totalPages}
          onPress={() => onPageChange?.(clampPage(currentPage + 1))}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// Export utility functions for use in components that need pagination calculations
export { getFirstItemOnPage, getLastItemOnPage };
