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
import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import Well from '~/partials/Well';
import SectionHeader from '~/components/SectionHeader';
import { recentTableClasses } from '~/utils/tableStyles';

import type { RecentPatient } from './types';

export type RecentPatientsProps = {
  rows?: RecentPatient[]; // Keep for backward compatibility but use context
};

export default function RecentPatients() {
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

  const handleSelection = (e: React.Key | Set<React.Key>) => {
    const key = e instanceof Set ? Array.from(e)[0] : e;
    navigate(`/clinics/${params.clinicId}/patients/${key}`);
  };

  const TableHeading = (
    <SectionHeader icon={History} title="Recently Viewed Patients" />
  );

  const EmptyContent = (
    <p className="text-center text-default-400 py-4">
      There are no recently viewed patients to show
    </p>
  );

  return (
    <Well className="bg-transparent">
      <Table
        className="flex flex-1 flex-col text-content1-foreground gap-4"
        aria-label="Recently viewed patients"
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
        <TableBody emptyContent={EmptyContent} items={patients}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{getKeyValue(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Well>
  );
}
