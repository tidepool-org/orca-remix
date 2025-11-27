import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
} from '@nextui-org/react';
import { Mail, ChevronDown } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { PatientInvite } from './types';

export type PatientInvitesTableProps = {
  invites: PatientInvite[];
  totalInvites: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

const columns: Column[] = [
  { key: 'patientName', label: 'PATIENT NAME', sortable: false },
  { key: 'birthday', label: 'BIRTHDAY', sortable: false },
  { key: 'userId', label: 'USER ID', sortable: false },
  { key: 'created', label: 'INVITED', sortable: false },
  { key: 'expiresAt', label: 'EXPIRES', sortable: false },
];

type SortDescriptor = {
  column: string;
  direction: 'ascending' | 'descending';
};

export default function PatientInvitesTable({
  invites,
  totalInvites = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
}: PatientInvitesTableProps) {
  const { locale } = useLocale();
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'created',
    direction: 'descending',
  });
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Filter to pending invites only
  const pendingInvites = React.useMemo(() => {
    return invites.filter((invite) => invite.status === 'pending');
  }, [invites]);

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (pendingInvites.length > 0 ? Math.ceil(totalInvites / totalPages) : 25);
  const firstInviteOnPage =
    pendingInvites.length > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastInviteOnPage = Math.min(
    currentPage * effectivePageSize,
    pendingInvites.length,
  );

  // Generate header text based on expanded state
  const headerText =
    isExpanded && pendingInvites.length > 0
      ? `(showing ${firstInviteOnPage}-${lastInviteOnPage} of ${pendingInvites.length} pending patient invites)`
      : `Pending Patient Invites (${pendingInvites.length})`;

  const renderCell = React.useCallback(
    (
      invite: PatientInvite,
      columnKey:
        | keyof PatientInvite
        | 'actions'
        | 'patientName'
        | 'birthday'
        | 'userId',
    ) => {
      const cellValue = invite[columnKey as keyof PatientInvite];

      switch (columnKey) {
        case 'patientName':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">
                {invite.creator.profile.patient.fullName ||
                  invite.creator.profile.fullName}
              </p>
            </div>
          );
        case 'birthday':
          return (
            <p className="text-sm text-default-600">
              {invite.creator.profile.patient.birthday
                ? intlFormat(
                    new Date(invite.creator.profile.patient.birthday),
                    { year: 'numeric', month: 'short', day: 'numeric' },
                    { locale },
                  )
                : '—'}
            </p>
          );
        case 'userId':
          return <p className="text-sm font-mono">{invite.creator.userid}</p>;
        case 'created':
          if (!cellValue) return <span className="text-default-400">—</span>;
          return (
            <p className="text-sm text-default-600">
              {intlFormat(
                new Date(cellValue as string),
                { year: 'numeric', month: 'short', day: 'numeric' },
                { locale },
              )}
            </p>
          );
        case 'expiresAt':
          if (!cellValue) return <span className="text-default-400">—</span>;
          return (
            <p className="text-sm text-default-600">
              {intlFormat(
                new Date(cellValue as string),
                { year: 'numeric', month: 'short', day: 'numeric' },
                { locale },
              )}
            </p>
          );
        default:
          return <span className="text-default-400">—</span>;
      }
    },
    [locale],
  );

  const TableHeading = (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-full p-4 rounded-lg border border-content2 bg-content1 hover:bg-content2 transition-colors duration-200 flex justify-between items-center"
      aria-expanded={isExpanded}
      aria-controls="patient-invites-table-content"
    >
      <div className="flex gap-2 items-center">
        <Mail />
        <h2 className="text-lg font-semibold">{headerText}</h2>
      </div>
      <div className="flex items-center gap-2">
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
    </button>
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Mail className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">
        No pending patient invites found for this clinic
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading patient invites..." />
    </div>
  );

  return (
    <div className="w-full">
      {TableHeading}

      {isExpanded && (
        <div
          id="patient-invites-table-content"
          className="mt-4 transition-all duration-300"
        >
          <Table
            aria-label="Clinic patient invites table"
            className="flex flex-1 flex-col text-content1-foreground gap-4"
            shadow="none"
            removeWrapper
            classNames={{
              th: 'bg-content1',
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-content1 text-content1-foreground font-medium"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              isLoading={isLoading}
              items={pendingInvites || []}
            >
              {(invite) => (
                <TableRow key={invite.key}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(
                        invite,
                        columnKey as
                          | keyof PatientInvite
                          | 'actions'
                          | 'patientName'
                          | 'birthday'
                          | 'userId',
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                page={currentPage}
                total={totalPages}
                onChange={onPageChange}
                showControls
                showShadow
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
