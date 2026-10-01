import type { SortDescriptor } from '@heroui/react';

type ParsedSort<C extends string> = {
  column: C;
  direction: 'ascending' | 'descending';
};

type Comparator<T> = (a: T, b: T) => number;

/** Parses a `+column` / `-column` sort string; unknown columns yield undefined. */
export function parseSortString<C extends string>(
  sort: string | undefined,
  columns: readonly C[],
): ParsedSort<C> | undefined {
  if (!sort) return undefined;
  const column = sort.replace(/^[+-]/, '') as C;
  if (!columns.includes(column)) return undefined;
  return {
    column,
    direction: sort.startsWith('-') ? 'descending' : 'ascending',
  };
}

export const compareText = (a = '', b = '') =>
  a.localeCompare(b, undefined, { sensitivity: 'base' });

// A missing date sorts as the oldest
export const compareDates = (a?: string, b?: string) =>
  (a ? Date.parse(a) : 0) - (b ? Date.parse(b) : 0);

/** Returns a sorted copy, or the rows untouched when the sort is missing or unknown. */
export function sortRows<T, C extends string>(
  rows: T[],
  sort: string | undefined,
  comparators: Record<C, Comparator<T>>,
): T[] {
  const parsed = parseSortString(sort, Object.keys(comparators) as C[]);
  if (!parsed) return rows;
  const compare = comparators[parsed.column];
  const sign = parsed.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => sign * compare(a, b));
}

/**
 * Keeps rows where any of the fields contains the search, ignoring case;
 * a blank search keeps every row.
 */
export function filterRows<T>(
  rows: T[],
  search: string | undefined,
  fields: (row: T) => (string | undefined)[],
): T[] {
  const term = search?.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) =>
    fields(row).some((field) => field?.toLowerCase().includes(term)),
  );
}

/**
 * Props for a HeroUI `Table` whose sort lives in a `+column` / `-column`
 * string. Columns in `descendingFirst` sort descending on their first click;
 * after that, clicks toggle as usual.
 */
export function getSortHeaderProps({
  currentSort,
  columns,
  onSort,
  descendingFirst = [],
  defaultSort,
}: {
  currentSort?: string;
  columns: readonly string[];
  onSort?: (sort: string) => void;
  descendingFirst?: readonly string[];
  defaultSort?: SortDescriptor;
}) {
  const sortDescriptor: SortDescriptor | undefined =
    parseSortString(currentSort, columns) ?? defaultSort;

  const onSortChange = (descriptor: SortDescriptor) => {
    if (!onSort || !descriptor.column) return;
    const column = String(descriptor.column);
    const descending =
      (descendingFirst.includes(column) && sortDescriptor?.column !== column) ||
      descriptor.direction === 'descending';
    onSort(`${descending ? '-' : '+'}${column}`);
  };

  return { sortDescriptor, onSortChange };
}
