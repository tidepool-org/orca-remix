import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { FileText } from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useHref } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../ui/CollapsibleTableWrapper';
import { collapsibleTableClasses, columnClass } from '~/utils/tableStyles';
import type { Prescription } from './types';
import type { ResourceState } from '~/api.types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import DebouncedSearchInput from '~/components/ui/DebouncedSearchInput';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import StatusChip from '~/components/ui/StatusChip';
import ResourceError from '~/components/ui/ResourceError';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import { formatDateTime } from '~/utils/dateFormatters';
import { getPatientName } from '~/utils/prescriptions';
import { getSortHeaderProps } from '~/utils/tableRows';

/**
 * Context determines how navigation works when selecting a prescription:
 * - 'clinic': Uses clinicId prop or route params, preserves search params (default)
 * - 'user': Uses clinicId from each prescription's data
 */
export type PrescriptionsTableContext = 'clinic' | 'user';

export type PrescriptionsTableProps = {
  prescriptions: Prescription[];
  prescriptionsState?: ResourceState<Prescription[]>;
  totalPrescriptions: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Clinic ID for navigation in 'clinic' context. Falls back to route params if not provided. */
  clinicId?: string;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
  /** Context determines navigation behavior. Defaults to 'clinic'. */
  context?: PrescriptionsTableContext;
  onSearch?: (search: string) => void;
  currentSearch?: string;
  onSort?: (sort: string) => void;
  currentSort?: string;
};

type Column = {
  key: string;
  label: string;
};

export default function PrescriptionsTable({
  prescriptions = [],
  prescriptionsState,
  totalPrescriptions = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  clinicId,
  isFirstInGroup = false,
  context = 'clinic',
  onSearch,
  currentSearch = '',
  onSort,
  currentSort,
}: PrescriptionsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const effectiveClinicId = clinicId || params.clinicId;
  const exportHref = useHref(
    `/clinics/${effectiveClinicId}/export?type=prescriptions`,
  );

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (prescriptions.length > 0
      ? Math.ceil(totalPrescriptions / totalPages)
      : 25);
  const firstPrescriptionOnPage = getFirstItemOnPage(
    currentPage,
    effectivePageSize,
    totalPrescriptions,
  );
  const lastPrescriptionOnPage = getLastItemOnPage(
    currentPage,
    effectivePageSize,
    totalPrescriptions,
  );

  const columns: Column[] = [
    {
      key: 'patientName',
      label: 'Patient Name',
    },
    {
      key: 'state',
      label: 'State',
    },
    {
      key: 'createdTime',
      label: 'Created',
    },
    {
      key: 'expirationTime',
      label: 'Expires',
    },
  ];

  const sortHeaderProps = getSortHeaderProps({
    currentSort,
    columns: columns.map((c) => c.key),
    onSort,
    descendingFirst: ['createdTime', 'expirationTime'],
  });

  const renderCell = React.useCallback(
    (item: Prescription, columnKey: string) => {
      switch (columnKey) {
        case 'patientName': {
          const patientName = getPatientName(item);
          return (
            <div className="flex flex-col">
              <p className="font-semibold text-[color:var(--text-heading)]">
                {patientName}
              </p>
              <CopyableIdentifier label="ID:" value={item.id} size="sm" />
            </div>
          );
        }
        case 'state':
          return <StatusChip status={item.state} type="prescription" />;
        case 'createdTime':
          return (
            <span className="text-sm">
              {item.createdTime
                ? formatDateTime(item.createdTime, locale)
                : 'N/A'}
            </span>
          );
        case 'expirationTime':
          return (
            <span className="text-sm">
              {item.expirationTime
                ? formatDateTime(item.expirationTime, locale)
                : 'N/A'}
            </span>
          );
        default:
          return (
            <span className="text-sm">
              {String(item[columnKey as keyof Prescription] ?? 'N/A')}
            </span>
          );
      }
    },
    [locale],
  );

  const EmptyContent = (
    <TableEmptyState icon={FileText} message="No prescriptions found" />
  );

  const LoadingContent = <TableLoadingState label="Loading prescriptions..." />;

  // Check if there's an error state to display
  const hasError = prescriptionsState?.status === 'error';

  return (
    <CollapsibleTableWrapper
      icon={<FileText className="h-5 w-5" aria-hidden="true" />}
      title="Prescriptions"
      totalItems={totalPrescriptions}
      isFirstInGroup={isFirstInGroup}
      exportHref={context === 'clinic' ? exportHref : undefined}
      showRange={{
        firstItem: firstPrescriptionOnPage,
        lastItem: lastPrescriptionOnPage,
      }}
    >
      {hasError ? (
        <ResourceError
          title="Prescriptions"
          message={prescriptionsState.error.message}
        />
      ) : (
        <>
          <div className="flex justify-start mb-4">
            <DebouncedSearchInput
              placeholder="Filter by patient name or state..."
              aria-label="Filter prescriptions by patient name or state"
              value={currentSearch}
              onSearch={(value) => onSearch?.(value)}
              debounceMs={1000}
            />
          </div>
          <Table
            aria-label="Prescriptions table"
            shadow="none"
            removeWrapper
            selectionMode="single"
            onSelectionChange={(keys: 'all' | Set<React.Key>) => {
              const key = keys instanceof Set ? Array.from(keys)[0] : keys;
              if (key && key !== 'all') {
                let targetClinicId: string | undefined;

                if (context === 'user') {
                  // In user context, get clinicId from the prescription itself
                  const prescription = prescriptions.find((p) => p.id === key);
                  targetClinicId = prescription?.clinicId;
                } else {
                  // In clinic context, use prop or route params, preserve search params
                  targetClinicId = effectiveClinicId;
                }

                if (targetClinicId) {
                  // Only preserve search params in clinic context
                  const queryString =
                    context === 'clinic' ? searchParams.toString() : '';
                  navigate(
                    `/clinics/${targetClinicId}/prescriptions/${key}${queryString ? `?${queryString}` : ''}`,
                  );
                }
              }
            }}
            classNames={collapsibleTableClasses}
            {...sortHeaderProps}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  allowsSorting
                  className={columnClass}
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
              {prescriptions.map((item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(item, columnKey as string)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalPrescriptions}
            pageSize={effectivePageSize}
            onPageChange={onPageChange}
          />
        </>
      )}
    </CollapsibleTableWrapper>
  );
}
