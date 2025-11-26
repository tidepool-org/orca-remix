import { useNavigate, useParams } from '@remix-run/react';
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
import { useRecentItems } from './RecentItemsContext';
import type { RecentClinician } from './types';

export type RecentCliniciansProps = {
  recentClinicians?: RecentClinician[]; // Keep for backward compatibility but use context
};

export default function RecentClinicians() {
  const navigate = useNavigate();
  const params = useParams();
  const { recentClinicians } = useRecentItems();

  // Always use context data for real-time updates
  const clinicians = recentClinicians;

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email Address',
    },
  ];

  const handleSelection = (e: React.Key | Set<React.Key>) => {
    const key = e instanceof Set ? Array.from(e)[0] : e;
    navigate(`/clinics/${params.clinicId}/clinicians/${key}`);
  };

  const TableHeading = (
    <div className="flex gap-2">
      <History />
      <h2 className="text-lg font-semibold">Recently Viewed Clinicians</h2>
    </div>
  );

  const EmptyContent = <span>There are no recently viewed clinicians to show</span>;

  return (
    <Table
      className="flex flex-1 flex-col text-content1-foreground gap-4"
      aria-label="Recently viewed clinicians"
      shadow="none"
      removeWrapper
      selectionMode="single"
      onSelectionChange={handleSelection}
      topContent={TableHeading}
      classNames={{
        th: 'bg-content1',
      }}
    >
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody emptyContent={EmptyContent} items={clinicians}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
