import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from '@heroui/react';
import { History } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SectionPanel from '~/components/ui/SectionPanel';
import { recentTableClasses, columnClass } from '~/utils/tableStyles';

type Column = {
  key: string;
  label: string;
  /** When true, render this column's cells in primary-cell style (semibold + heading color). Defaults to true for the first column. */
  primary?: boolean;
};

type RecentItemsTableProps<T extends { id: string }> = {
  /**
   * Items to display in the table
   */
  items: T[];
  /**
   * Column configuration
   */
  columns: Column[];
  /**
   * Callback when a row is selected
   */
  onSelect: (key: React.Key) => void;
  /**
   * Aria label for the table
   */
  'aria-label': string;
  /**
   * Title displayed in the section header
   */
  title: string;
  /**
   * Message shown when table is empty
   */
  emptyMessage: string;
  /**
   * Icon for the section header (defaults to History)
   */
  icon?: LucideIcon;
  /**
   * Key field for row identification (defaults to 'id')
   */
  rowKey?: keyof T;
  /**
   * Custom cell renderer function
   */
  renderCell?: (item: T, columnKey: string) => React.ReactNode;
};

/**
 * Reusable table component for displaying recently viewed items.
 * Provides consistent styling and behavior across different entity types.
 *
 * @example
 * // Recent patients
 * <RecentItemsTable
 *   items={recentPatients}
 *   columns={[
 *     { key: 'fullName', label: 'Name' },
 *     { key: 'email', label: 'Email Address' },
 *   ]}
 *   onSelect={(key) => navigate(`/clinics/${clinicId}/patients/${key}`)}
 *   aria-label="Recently viewed patients"
 *   title="Recently Viewed Patients"
 *   emptyMessage="There are no recently viewed patients to show"
 * />
 *
 * @example
 * // Recent users with custom row key
 * <RecentItemsTable
 *   items={recentUsers}
 *   columns={columns}
 *   onSelect={(key) => navigate(`/users/${key}`)}
 *   aria-label="Recently viewed users"
 *   title="Recently Viewed Users"
 *   emptyMessage="There are no recently viewed users to show"
 *   rowKey="userid"
 * />
 */
export default function RecentItemsTable<T extends { id: string }>({
  items,
  columns,
  onSelect,
  'aria-label': ariaLabel,
  title,
  emptyMessage,
  icon: Icon = History,
  rowKey = 'id' as keyof T,
  renderCell,
}: RecentItemsTableProps<T>) {
  const handleSelection = (e: React.Key | Set<React.Key>) => {
    const key = e instanceof Set ? Array.from(e)[0] : e;
    if (key) {
      onSelect(key);
    }
  };

  const EmptyContent = (
    <p className="text-center text-default-400 py-4">{emptyMessage}</p>
  );

  const defaultRenderCell = (item: T, columnKey: string) => {
    return getKeyValue(item, columnKey);
  };

  return (
    <SectionPanel icon={<Icon />} title={title} aria-label={ariaLabel}>
      <Table
        className="flex flex-1 flex-col text-content1-foreground gap-4"
        aria-label={ariaLabel}
        shadow="none"
        removeWrapper
        selectionMode="single"
        onSelectionChange={handleSelection}
        layout="fixed"
        classNames={{
          th: recentTableClasses.th,
          td: recentTableClasses.td,
          tr: recentTableClasses.tr,
          table: 'table-fixed',
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className={columnClass}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={EmptyContent} items={items}>
          {(item) => (
            <TableRow key={String(item[rowKey])}>
              {(columnKey) => {
                const colIndex = columns.findIndex((c) => c.key === columnKey);
                const col = columns[colIndex];
                const isPrimary = col?.primary ?? colIndex === 0;
                const cellClass = isPrimary
                  ? 'font-semibold text-[color:var(--text-heading)]'
                  : undefined;
                return (
                  <TableCell className={cellClass}>
                    {renderCell
                      ? renderCell(item, columnKey as string)
                      : defaultRenderCell(item, columnKey as string)}
                  </TableCell>
                );
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </SectionPanel>
  );
}
