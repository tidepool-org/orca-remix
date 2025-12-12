import { ReactNode } from 'react';

export type DetailField = {
  /** Label for the field */
  label: string;
  /** Value to display - can be string or ReactNode for custom rendering */
  value: ReactNode;
  /** Whether to hide this field (useful for conditional fields) */
  hidden?: boolean;
};

export type DetailGridProps = {
  /** Array of detail fields to display */
  fields: DetailField[];
  /** Number of columns at different breakpoints */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Gap between columns (Tailwind gap-x value) */
  columnGap?: 'gap-x-4' | 'gap-x-6' | 'gap-x-8';
  /** Gap between rows (Tailwind gap-y value) */
  rowGap?: 'gap-y-2' | 'gap-y-3' | 'gap-y-4';
  /** Additional className for the grid container */
  className?: string;
};

/**
 * A reusable grid layout for displaying label/value detail fields.
 * Provides consistent styling and responsive column layouts.
 *
 * @example
 * // Basic usage
 * <DetailGrid
 *   fields={[
 *     { label: 'Name', value: 'John Doe' },
 *     { label: 'Email', value: 'john@example.com' },
 *     { label: 'Status', value: <StatusChip status="active" /> },
 *   ]}
 * />
 *
 * @example
 * // With conditional fields
 * <DetailGrid
 *   fields={[
 *     { label: 'Name', value: user.name },
 *     { label: 'Phone', value: user.phone, hidden: !user.phone },
 *   ]}
 * />
 *
 * @example
 * // Custom columns
 * <DetailGrid
 *   fields={fields}
 *   columns={{ default: 1, sm: 2, md: 3 }}
 * />
 */
export default function DetailGrid({
  fields,
  columns = { default: 2, sm: 2, md: 3, lg: 4 },
  columnGap = 'gap-x-4',
  rowGap = 'gap-y-2',
  className = '',
}: DetailGridProps) {
  // Filter out hidden fields
  const visibleFields = fields.filter((field) => !field.hidden);

  if (visibleFields.length === 0) {
    return null;
  }

  // Build responsive grid column classes
  const getColumnClass = (count: number | undefined, prefix: string = '') => {
    if (!count) return '';
    const colClass = `grid-cols-${count}`;
    return prefix ? `${prefix}:${colClass}` : colClass;
  };

  const gridClasses = [
    'grid',
    'text-sm',
    getColumnClass(columns.default),
    getColumnClass(columns.sm, 'sm'),
    getColumnClass(columns.md, 'md'),
    getColumnClass(columns.lg, 'lg'),
    columnGap,
    rowGap,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClasses}>
      {visibleFields.map((field, index) => (
        <div key={index}>
          <span className="text-default-400 block text-xs">{field.label}</span>
          <span className="text-default-600">{field.value}</span>
        </div>
      ))}
    </div>
  );
}
