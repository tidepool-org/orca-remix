import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from '@nextui-org/react';

import { History } from 'lucide-react';
import { useNavigate } from 'react-router';

import type { RecentUser } from './types';

export type RecentUsersProps = {
  rows: RecentUser[];
};

export default function RecentUsers({ rows }: RecentUsersProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'fullName',
      label: 'Name',
    },
    {
      key: 'username',
      label: 'Email Address',
    },
  ];

  const handleSelection = (e) => {
    navigate(`/users/${e.currentKey}`);
  };

  const TableHeading = (
    <div className="flex gap-2">
      <History />
      <h2 className="text-lg font-semibold">Recently Viewed Users</h2>
    </div>
  );

  const EmptyContent = <span>There are no recently viewed users to show</span>;

  return (
    <Table
      className="flex flex-1 flex-col text-content1-foreground gap-4"
      aria-label="Recently viewed users"
      selectionMode="single"
      onSelectionChange={handleSelection}
      shadow="none"
      topContent={TableHeading}
      removeWrapper
      classNames={{
        th: 'bg-content1',
      }}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        ))}
      </TableHeader>

      <TableBody emptyContent={EmptyContent}>
        {rows.map((row) => (
          <TableRow key={row.userid}>
            {(columnKey) => (
              <TableCell>{getKeyValue(row, columnKey)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
