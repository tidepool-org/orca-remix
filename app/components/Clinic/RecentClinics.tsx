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
import { useNavigate } from 'react-router';
import Well from '~/partials/Well';
import SectionHeader from '~/components/SectionHeader';
import { recentTableClasses } from '~/utils/tableStyles';

import type { RecentClinic } from './types';

export type UserProfileProps = {
  rows: RecentClinic[];
};

export default function RecentClinics({ rows }: UserProfileProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'shareCode',
      label: 'Share Code',
    },
  ];

  const handleSelection = (e: React.Key | Set<React.Key>) => {
    const key = e instanceof Set ? Array.from(e)[0] : e;
    navigate(`/clinics/${key}`);
  };

  const TableHeading = (
    <SectionHeader icon={History} title="Recently Viewed Clinics" />
  );

  const EmptyContent = (
    <p className="text-center text-default-400 py-4">
      There are no recently viewed clinics to show
    </p>
  );

  return (
    <Well className="bg-transparent">
      <Table
        className="flex flex-1 flex-col text-content1-foreground gap-4"
        aria-label="Recently viewed clinics"
        selectionMode="single"
        onSelectionChange={handleSelection}
        shadow="none"
        topContent={TableHeading}
        removeWrapper
        classNames={{
          th: recentTableClasses.th,
          tr: recentTableClasses.tr,
        }}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>

        <TableBody emptyContent={EmptyContent}>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {(columnKey) => (
                <TableCell>{getKeyValue(row, columnKey)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Well>
  );
}
