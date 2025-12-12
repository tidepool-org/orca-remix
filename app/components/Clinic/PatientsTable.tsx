/* eslint-disable react/prop-types */
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  SortDescriptor,
  Tooltip,
} from '@heroui/react';
import { Users } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import useClinicResolvers from '~/hooks/useClinicResolvers';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { Patient } from './types';
import DebouncedSearchInput from '../DebouncedSearchInput';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import { formatShortDate } from '~/utils/dateFormatters';

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
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
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
  isFirstInGroup = false,
}: PatientsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  const { getTagName, getSiteName } = useClinicResolvers(clinic);

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

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (patients.length > 0 ? Math.ceil(totalPatients / totalPages) : 25);
  const firstPatientOnPage = getFirstItemOnPage(
    currentPage,
    effectivePageSize,
    totalPatients,
  );
  const lastPatientOnPage = getLastItemOnPage(
    currentPage,
    effectivePageSize,
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
              {formatShortDate(patient.birthDate, locale)}
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
              {formatShortDate(patient.createdTime, locale)}
            </p>
          );
        default:
          return null;
      }
    },
    [locale, getTagName, getSiteName],
  );

  const EmptyContent = (
    <TableEmptyState icon={Users} message="No patients found for this clinic" />
  );

  const LoadingContent = <TableLoadingState label="Loading patients..." />;

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Patients"
      totalItems={totalPatients}
      isFirstInGroup={isFirstInGroup}
      showRange={{
        firstItem: firstPatientOnPage,
        lastItem: lastPatientOnPage,
      }}
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

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalPatients}
        pageSize={effectivePageSize}
        onPageChange={onPageChange}
      />
    </CollapsibleTableWrapper>
  );
}
