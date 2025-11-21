import React from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Chip,
  Button,
} from '@nextui-org/react';
import { UserCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { Clinician } from './types';

export type CliniciansTableProps = {
  clinicians: Clinician[];
  totalClinicians: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
};

type Column = {
  key: keyof Clinician | 'actions';
  label: string;
  sortable?: boolean;
};

type SortDescriptor = {
  column: string;
  direction: 'ascending' | 'descending';
};

export default function CliniciansTable({
  clinicians,
  totalClinicians = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  onSort,
}: CliniciansTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'fullName',
    direction: 'ascending',
  });
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate pagination details
  const effectivePageSize = pageSize ?? (clinicians.length > 0 ? Math.ceil(totalClinicians / totalPages) : 25);
  const firstClinicianOnPage = totalClinicians > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastClinicianOnPage = Math.min(currentPage * effectivePageSize, totalClinicians);

  // Generate header text based on expanded state
  const headerText = isExpanded && totalClinicians > 0
    ? `Clinicians (showing ${firstClinicianOnPage}-${lastClinicianOnPage} of ${totalClinicians})`
    : `Clinicians (${totalClinicians})`;

  const columns: Column[] = [
    {
      key: 'fullName',
      label: 'Clinician Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
    },
    {
      key: 'createdTime',
      label: 'Added',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
    },
  ];

  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
    if (onSort) {
      const direction = descriptor.direction === 'ascending' ? 'asc' : 'desc';
      onSort(descriptor.column, direction);
    }
  };

  const renderCell = React.useCallback(
    (clinician: Clinician, columnKey: keyof Clinician | 'actions') => {
      const cellValue = clinician[columnKey as keyof Clinician];

      switch (columnKey) {
        case 'fullName':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{cellValue}</p>
              <p className="text-tiny text-default-400 capitalize">
                ID: {clinician.id}
              </p>
            </div>
          );
        case 'email':
          return (
            <p className="text-sm text-default-600">{cellValue}</p>
          );
        case 'role':
          return (
            <Chip
              className="capitalize"
              color={cellValue === 'admin' ? 'primary' : 'default'}
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case 'createdTime':
          return (
            <p className="text-sm">
              {intlFormat(
                new Date(cellValue as string),
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                },
                { locale }
              )}
            </p>
          );
        case 'actions':
          return (
            <div className="relative flex items-center gap-2">
              <Button
                size="sm"
                variant="light"
                onPress={() => {
                  // Navigate to clinician profile page
                  navigate(`/clinics/${params.clinicId}/clinicians/${clinician.id}`);
                }}
              >
                View
              </Button>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [locale, navigate, params.clinicId]
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortDescriptor.column !== column) {
      return null;
    }
    return sortDescriptor.direction === 'ascending' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const TableHeading = (
    <button
      className="flex justify-between items-center w-full p-4 bg-content2 rounded-lg hover:bg-content3 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      aria-controls="clinicians-table-content"
    >
      <div className="flex gap-2 items-center">
        <UserCheck />
        <h2 className="text-lg font-semibold">{headerText}</h2>
      </div>
      <div className="flex items-center gap-2">
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <UserCheck className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">No clinicians found for this clinic</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="w-full">
      {TableHeading}

      {isExpanded && (
        <div id="clinicians-table-content" className="mt-4 transition-all duration-300">
          <Table
            aria-label="Clinic clinicians table"
            className="flex flex-1 flex-col text-content1-foreground gap-4"
            shadow="none"
            removeWrapper
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            classNames={{
              th: 'bg-content1',
              table: 'min-h-[400px]',
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  allowsSorting={column.sortable}
                  className="text-left"
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && <SortIcon column={column.key} />}
                  </div>
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              loadingState={isLoading ? 'loading' : 'idle'}
            >
              {clinicians.map((clinician) => (
                <TableRow key={clinician.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(clinician, columnKey as keyof Clinician | 'actions')}</TableCell>
                  )}
                </TableRow>
              ))}
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
