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
  SortDescriptor,
} from '@nextui-org/react';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { Patient } from './types';
import DebouncedSearchInput from '../DebouncedSearchInput';

export type PatientsTableProps = {
  patients: Patient[];
  totalPatients: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (sort: string) => void;
  onSearch?: (search: string) => void;
  currentSort?: string;
  currentSearch?: string;
};

type Column = {
  key: keyof Patient | 'actions';
  label: string;
  sortable?: boolean;
};

export default function PatientsTable({
  patients,
  totalPatients = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  onSort,
  onSearch,
  currentSort,
  currentSearch,
}: PatientsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  // Parse current sort to set initial sort descriptor
  const parseSortString = (sortStr?: string) => {
    if (!sortStr) return { column: 'fullName', direction: 'ascending' as const };
    const direction = sortStr.startsWith('-') ? 'descending' as const : 'ascending' as const;
    const column = sortStr.replace(/^[+-]/, '');
    return { column, direction };
  };

  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>(
    parseSortString(currentSort)
  );
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate pagination details
  const effectivePageSize = pageSize ?? (patients.length > 0 ? Math.ceil(totalPatients / totalPages) : 25);
  const firstPatientOnPage = totalPatients > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastPatientOnPage = Math.min(currentPage * effectivePageSize, totalPatients);

  // Generate header text based on expanded state
  const headerText = isExpanded && totalPatients > 0
    ? `Patients (showing ${firstPatientOnPage}-${lastPatientOnPage} of ${totalPatients})`
    : `Patients (${totalPatients})`;

  const columns: Column[] = [
    {
      key: 'fullName',
      label: 'Patient Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
    },
    {
      key: 'birthDate',
      label: 'Birth Date',
      sortable: false,
    },
    {
      key: 'mrn',
      label: 'MRN',
      sortable: false,
    },
    {
      key: 'tags',
      label: 'Tags',
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

  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
    if (onSort && descriptor.column) {
      const direction = descriptor.direction === 'ascending' ? '+' : '-';
      const sortString = `${direction}${descriptor.column}`;
      onSort(sortString);
    }
  };

  const renderCell = React.useCallback(
    (patient: Patient, columnKey: keyof Patient | 'actions') => {
      switch (columnKey) {
        case 'fullName':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{patient.fullName}</p>
              <p className="text-tiny text-default-400 capitalize">
                ID: {patient.id}
              </p>
            </div>
          );
        case 'email':
          return (
            <p className="text-sm text-default-600">{patient.email}</p>
          );
        case 'birthDate':
          return patient.birthDate ? (
            <p className="text-sm">
              {intlFormat(
                new Date(patient.birthDate),
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                },
                { locale }
              )}
            </p>
          ) : (
            <span className="text-default-400">—</span>
          );
        case 'mrn':
          return patient.mrn ? (
            <p className="text-sm font-mono">{patient.mrn}</p>
          ) : (
            <span className="text-default-400">—</span>
          );
        case 'tags':
          return patient.tags && patient.tags.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {patient.tags.slice(0, 2).map((tag: string, index: number) => (
                <Chip key={index} size="sm" variant="flat" color="primary">
                  {tag}
                </Chip>
              ))}
              {patient.tags.length > 2 && (
                <Chip size="sm" variant="flat" color="default">
                  +{patient.tags.length - 2}
                </Chip>
              )}
            </div>
          ) : (
            <span className="text-default-400">—</span>
          );
        case 'createdTime':
          return (
            <p className="text-sm">
              {intlFormat(
                new Date(patient.createdTime),
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
                  // Navigate to patient profile page
                  navigate(`/clinics/${params.clinicId}/patients/${patient.id}`);
                }}
              >
                View User
              </Button>
            </div>
          );
        default:
          return null;
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
      aria-controls="patients-table-content"
    >
      <div className="flex gap-2 items-center">
        <Users />
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
      <Users className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">No patients found for this clinic</span>
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
        <div id="patients-table-content" className="mt-4 transition-all duration-300">
          {/* Search Controls */}
          <div className="flex justify-start mb-4 p-4 bg-content1 rounded-lg">
            <DebouncedSearchInput
              placeholder="Search patients..."
              value={currentSearch || ''}
              onSearch={(value) => onSearch?.(value)}
              debounceMs={1000}
            />
          </div>

          <Table
            aria-label="Clinic patients table"
            className="flex flex-1 flex-col text-content1-foreground gap-4"
            shadow="none"
            removeWrapper
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            classNames={{
              th: 'bg-content1',
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
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(patient, columnKey as keyof Patient | 'actions')}</TableCell>
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
