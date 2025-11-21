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
import { useNavigate, useParams } from '@remix-run/react';
import { useRecentItems } from './RecentItemsContext';

import type { RecentPatient } from './types';

export type RecentPatientsProps = {
  rows?: RecentPatient[]; // Keep for backward compatibility but use context
};

export default function RecentPatients({ rows }: RecentPatientsProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { recentPatients } = useRecentItems();

  // Always use context data for real-time updates
  const patients = recentPatients;

  const columns = [
    {
      key: 'fullName',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email Address',
    },
  ];

  const handleSelection = (e: any) => {
    navigate(`/clinics/${params.clinicId}/patients/${e.currentKey}`);
  };

  const TableHeading = (
    <div className="flex gap-2">
      <History />
      <h2 className="text-lg font-semibold">Recently Viewed Patients</h2>
    </div>
  );

  const EmptyContent = <span>There are no recently viewed patients to show</span>;

  return (
    <Table
      className="flex flex-1 flex-col text-content1-foreground gap-4"
      aria-label="Recently viewed patients"
      shadow="none"
      removeWrapper
      selectionMode="single"
      onSelectionChange={handleSelection}
      topContent={TableHeading}
      classNames={{
        th: 'bg-content1',
        table: 'min-h-[120px]',
      }}
    >
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody emptyContent={EmptyContent} items={rows}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
