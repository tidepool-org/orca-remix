/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
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
  SortDescriptor,
  Tooltip,
} from '@heroui/react';
import { Users } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
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
  clinic?: {
    patientTags?: {
      id: string;
      name: string;
    }[];
    sites?: {
      id: string;
      name: string;
    }[];
  };
};

type Column = {
  key: keyof Patient;
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
  clinic,
}: PatientsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();

  const clinicData = clinic;

  // Helper function to map tag ID to tag name
  const getTagName = useCallback(
    (tagId: string): string => {
      const tag = clinicData?.patientTags?.find((t) => t.id === tagId);
      return tag?.name || tagId; // Fallback to ID if name not found
    },
    [clinicData?.patientTags],
  );

  // Helper function to map site ID to site name
  const getSiteName = useCallback(
    (siteId: string): string => {
      const site = clinicData?.sites?.find((s) => s.id === siteId);
      return site?.name || siteId; // Fallback to ID if name not found
    },
    [clinicData?.sites],
  );
  // Parse current sort to set initial sort descriptor
  const parseSortString = (sortStr?: string) => {
    if (!sortStr)
      return { column: 'fullName', direction: 'ascending' as const };
    const direction = sortStr.startsWith('-')
      ? ('descending' as const)
      : ('ascending' as const);
    const column = sortStr.replace(/^[+-]/, '');
    return { column, direction };
  };

  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>(
    parseSortString(currentSort),
  );
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (patients.length > 0 ? Math.ceil(totalPatients / totalPages) : 25);
  const firstPatientOnPage =
    totalPatients > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastPatientOnPage = Math.min(
    currentPage * effectivePageSize,
    totalPatients,
  );

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
      key: 'sites',
      label: 'Sites',
      sortable: false,
    },
    {
      key: 'createdTime',
      label: 'Added',
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
    (patient: Patient, columnKey: keyof Patient) => {
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
          return <p className="text-sm text-default-600">{patient.email}</p>;
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
                { locale },
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
              {patient.tags.slice(0, 2).map((tagId: string, index: number) => (
                <Chip key={index} size="sm" variant="flat" color="primary">
                  {getTagName(tagId)}
                </Chip>
              ))}
              {patient.tags.length > 2 && (
                <Tooltip
                  content={
                    <div className="px-1 py-2">
                      <div className="text-small font-bold mb-2">
                        Additional Tags:
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {patient.tags
                          .slice(2)
                          .map((tagId: string, index: number) => (
                            <Chip
                              key={index}
                              size="sm"
                              variant="flat"
                              color="primary"
                            >
                              {getTagName(tagId)}
                            </Chip>
                          ))}
                      </div>
                    </div>
                  }
                  placement="top"
                >
                  <Chip
                    size="sm"
                    variant="flat"
                    color="default"
                    className="cursor-help"
                  >
                    +{patient.tags.length - 2}
                  </Chip>
                </Tooltip>
              )}
            </div>
          ) : (
            <span className="text-default-400">—</span>
          );
        case 'sites':
          return patient.sites && patient.sites.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {patient.sites.slice(0, 2).map((site, index: number) => (
                <Chip key={index} size="sm" variant="flat" color="secondary">
                  {getSiteName(site.id || site.name || String(site))}
                </Chip>
              ))}
              {patient.sites.length > 2 && (
                <Tooltip
                  content={
                    <div className="px-1 py-2">
                      <div className="text-small font-bold mb-2">
                        Additional Sites:
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {patient.sites.slice(2).map((site, index: number) => (
                          <Chip
                            key={index}
                            size="sm"
                            variant="flat"
                            color="secondary"
                          >
                            {getSiteName(site.id || site.name || String(site))}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  }
                  placement="top"
                >
                  <Chip
                    size="sm"
                    variant="flat"
                    color="default"
                    className="cursor-help"
                  >
                    +{patient.sites.length - 2}
                  </Chip>
                </Tooltip>
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
                { locale },
              )}
            </p>
          );
        default:
          return null;
      }
    },
    [locale, getTagName, getSiteName],
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Users className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">
        No patients found for this clinic
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading patients..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Patients"
      totalItems={totalPatients}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      showRange={{
        firstItem: firstPatientOnPage,
        lastItem: lastPatientOnPage,
      }}
      defaultExpanded={false}
    >
      {/* Search Controls */}
      <div className="flex justify-start mb-4">
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
        selectionMode="single"
        onSelectionChange={(keys: 'all' | Set<React.Key>) => {
          const key = keys instanceof Set ? Array.from(keys)[0] : keys;
          if (key && key !== 'all')
            navigate(`/clinics/${params.clinicId}/patients/${key}`);
        }}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
        classNames={collapsibleTableClasses}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              allowsSorting={column.sortable}
              className="text-left"
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        {/* eslint-disable-next-line react/prop-types */}
        <TableBody
          emptyContent={EmptyContent}
          loadingContent={LoadingContent}
          loadingState={isLoading ? 'loading' : 'idle'}
        >
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(patient, columnKey as keyof Patient)}
                </TableCell>
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
    </CollapsibleTableWrapper>
  );
}
