import React from 'react';
import { useNavigate, useParams } from 'react-router';
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
import { UserCheck, ChevronDown } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { Clinician } from './types';
import DebouncedSearchInput from '../DebouncedSearchInput';
export type CliniciansTableProps = {
  clinicians: Clinician[];
  totalClinicians: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  currentSearch?: string;
};

type Column = {
  key: keyof Clinician | 'actions';
  label: string;
  sortable?: boolean;
};

export default function CliniciansTable({
  clinicians,
  totalClinicians = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  onSearch,
  currentSearch,
}: CliniciansTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
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
      key: 'name',
      label: 'Clinician Name',
      sortable: false,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
    },
    {
      key: 'roles',
      label: 'Role',
      sortable: false,
    },
    {
      key: 'createdTime',
      label: 'Added',
      sortable: false,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
    },
  ];

  const renderCell = React.useCallback(
    (clinician: Clinician, columnKey: keyof Clinician | 'actions') => {
      const cellValue = clinician[columnKey as keyof Clinician];

      switch (columnKey) {
        case 'name':
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
        case 'roles': {
          // Handle roles array - display the first role or join them
          const rolesArray = cellValue as string[];
          const primaryRole = rolesArray && rolesArray.length > 0 ? rolesArray[0] : 'Unknown';
          return (
            <Chip
              className="capitalize"
              color={primaryRole.toLowerCase().includes('admin') ? 'primary' : 'default'}
              size="sm"
              variant="flat"
            >
              {primaryRole.replace('CLINIC_', '').toLowerCase()}
            </Chip>
          );
        }
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
          {/* Search Controls */}
          <div className="flex justify-start mb-4 p-4 bg-content1 rounded-lg">
            <DebouncedSearchInput
              placeholder="Search clinicians..."
              value={currentSearch || ''}
              onSearch={(value) => onSearch?.(value)}
              debounceMs={1000}
            />
          </div>

          <Table
            aria-label="Clinic clinicians table"
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
                  className="text-left"
                >
                  {column.label}
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
