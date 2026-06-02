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

// Shape overrides matching `handoff/visual-reference/skins.css:1053-1078` `.pg-btn`:
//   height: 30px; border-radius: --radius-sm (6px); border: 1px --border;
//   background: --surface; color: --text-muted; font-size: 12.5px; font-weight: 500;
//   hover: background --surface-2, color --text, border --border-strong;
//   disabled: opacity 0.4.
const PG_BTN_CLASSNAME =
  '!h-[30px] !min-h-[30px] !min-w-[30px] !w-[30px] !p-0 !rounded-[6px] ' +
  '!border !border-[color:var(--border)] !bg-[color:var(--surface)] ' +
  '!text-[color:var(--text-muted)] ' +
  'data-[hover=true]:!bg-[color:var(--surface-2)] ' +
  'data-[hover=true]:!text-[color:var(--text)] ' +
  'data-[hover=true]:!border-[color:var(--border-strong)] ' +
  'data-[disabled=true]:!opacity-40 transition-colors';

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
      className={`flex items-center justify-between gap-4 mt-[14px] pt-[13px] border-t border-[color:var(--border)] ${className}`}
    >
      {showRange && totalItems > 0 ? (
        <span className="text-[11.5px] font-mono text-[color:var(--text-faint)]">
          Showing{' '}
          <b className="text-[color:var(--text-muted)] font-semibold">
            {firstItem}-{lastItem}
          </b>{' '}
          of{' '}
          <b className="text-[color:var(--text-muted)] font-semibold">
            {totalItems}
          </b>
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-[6px]">
        <Button
          size="sm"
          variant="bordered"
          isIconOnly
          aria-label="Previous page"
          isDisabled={currentPage <= 1}
          onPress={() => onPageChange?.(clampPage(currentPage - 1))}
          className={PG_BTN_CLASSNAME}
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </Button>
        <span className="inline-flex items-center gap-[7px] text-[12px] text-[color:var(--text-muted)] mx-1">
          Page
          <Input
            size="sm"
            aria-label="Jump to page"
            classNames={{
              base: 'w-[46px]',
              inputWrapper:
                '!h-[30px] !min-h-[30px] !px-0 !rounded-[6px] !border !border-[color:var(--border)] !bg-[color:var(--field-bg)] shadow-none data-[focus=true]:!border-[color:var(--primary)] data-[focus=true]:!bg-[color:var(--surface)] data-[focus=true]:shadow-[0_0_0_3px_var(--primary-soft)] group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0',
              input:
                'text-center font-mono text-[12.5px] text-[color:var(--text)]',
            }}
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
          <span className="font-mono text-[color:var(--text-faint)]">
            of {totalPages}
          </span>
        </span>
        <Button
          size="sm"
          variant="bordered"
          isIconOnly
          aria-label="Next page"
          isDisabled={currentPage >= totalPages}
          onPress={() => onPageChange?.(clampPage(currentPage + 1))}
          className={PG_BTN_CLASSNAME}
        >
          <ChevronRight size={15} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// Export utility functions for use in components that need pagination calculations
export { getFirstItemOnPage, getLastItemOnPage };
