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
        aria-label={ariaLabel ?? placeholder}
        startContent={
          <Search className="w-4 h-4 text-default-400" aria-hidden="true" />
        }
        value={value}
        onClear={handleClear}
        onValueChange={onChange}
        size={size}
        className={maxWidth}
      />
      {showCount && (
        <span className="text-sm text-default-400 whitespace-nowrap">
          Showing {filteredCount} of {totalCount} {itemLabel}
        </span>
      )}
    </div>
  );
}
