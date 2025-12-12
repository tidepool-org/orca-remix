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
import Well from '~/partials/Well';
import SectionHeader from '~/components/SectionHeader';
import { recentTableClasses } from '~/utils/tableStyles';

type Column = {
  key: string;
  label: string;
};

type RecentItemsTableProps<T extends { id?: string }> = {
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
export default function RecentItemsTable<T extends { id?: string }>({
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

  const TableHeading = <SectionHeader icon={Icon} title={title} />;

  const EmptyContent = (
    <p className="text-center text-default-400 py-4">{emptyMessage}</p>
  );

  const defaultRenderCell = (item: T, columnKey: string) => {
    return getKeyValue(item, columnKey);
  };

  return (
    <Well className="bg-transparent">
      <Table
        className="flex flex-1 flex-col text-content1-foreground gap-4"
        aria-label={ariaLabel}
        shadow="none"
        removeWrapper
        selectionMode="single"
        onSelectionChange={handleSelection}
        topContent={TableHeading}
        classNames={{
          th: recentTableClasses.th,
          tr: recentTableClasses.tr,
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={EmptyContent} items={items}>
          {(item) => (
            <TableRow key={String(item[rowKey])}>
              {(columnKey) => (
                <TableCell>
                  {renderCell
                    ? renderCell(item, columnKey as string)
                    : defaultRenderCell(item, columnKey as string)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Well>
  );
}
