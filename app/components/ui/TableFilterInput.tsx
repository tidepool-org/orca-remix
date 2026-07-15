import { Input } from '@heroui/react';
import { Search } from 'lucide-react';

type TableFilterInputProps = {
  /**
   * Current filter value
   */
  value: string;
  /**
   * Callback when filter value changes
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
  /**
   * Aria label for accessibility (defaults to placeholder)
   */
  'aria-label'?: string;
  /**
   * Show a count of filtered vs total items
   */
  showResultCount?: boolean;
  /**
   * Number of items after filtering
   */
  filteredCount?: number;
  /**
   * Total number of items before filtering
   */
  totalCount?: number;
  /**
   * Label for items in the result count (e.g., "uploads", "clinics")
   */
  itemLabel?: string;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Size of the input (default: sm)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Maximum width class for the input (default: max-w-xs)
   */
  maxWidth?: string;
};

/**
 * A reusable filter input component for tables.
 * Includes a search icon, clearable input, and optional result count display.
 *
 * @example
 * // Basic usage
 * <TableFilterInput
 *   value={filterValue}
 *   onChange={setFilterValue}
 *   placeholder="Filter by name..."
 * />
 *
 * @example
 * // With result count
 * <TableFilterInput
 *   value={filterValue}
 *   onChange={setFilterValue}
 *   placeholder="Filter clinics..."
 *   showResultCount={filterValue !== ''}
 *   filteredCount={filteredClinics.length}
 *   totalCount={totalClinics}
 *   itemLabel="clinics"
 * />
 */
export default function TableFilterInput({
  value,
  onChange,
  placeholder = 'Filter...',
  'aria-label': ariaLabel,
  showResultCount = false,
  filteredCount,
  totalCount,
  itemLabel = 'items',
  className = '',
  size = 'sm',
  maxWidth = 'max-w-xs',
}: TableFilterInputProps) {
  const handleClear = () => {
    onChange('');
  };

  const showCount =
    showResultCount &&
    filteredCount !== undefined &&
    totalCount !== undefined &&
    value !== '';

  return (
    <div className={`flex justify-between items-center gap-4 ${className}`}>
      <Input
        isClearable
        placeholder={placeholder}
        aria-label={ariaLabel ?? `Filter ${itemLabel}`}
        startContent={
          <Search
            className="w-4 h-4 text-[color:var(--text-faint)]"
            aria-hidden="true"
          />
        }
        value={value}
        onClear={handleClear}
        onValueChange={onChange}
        size={size}
        className={maxWidth}
        classNames={{
          inputWrapper:
            'h-[34px] min-h-[34px] px-[11px] gap-2 bg-[color:var(--field-bg)] border border-[color:var(--field-border)] shadow-none rounded-[6px] data-[hover=true]:bg-[color:var(--field-bg)] data-[focus=true]:border-[color:var(--primary)] data-[focus=true]:!bg-[color:var(--surface)] group-data-[focus=true]:!bg-[color:var(--surface)] data-[focus=true]:shadow-[0_0_0_3px_var(--primary-soft)] group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0',
          input:
            'text-[13px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)]',
        }}
      />
      {showCount && (
        <span className="text-[11.5px] font-mono text-[color:var(--text-faint)] whitespace-nowrap">
          Showing {filteredCount} of {totalCount} {itemLabel}
        </span>
      )}
    </div>
  );
}
