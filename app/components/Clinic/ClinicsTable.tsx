import React from 'react';
import { useNavigate } from 'react-router';
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
} from '@nextui-org/react';
import { Building2 } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { Clinic, ClinicianClinicMembership } from './types';

export type ClinicsTableProps = {
  clinics: ClinicianClinicMembership[];
  totalClinics: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

type Column = {
  key: keyof Clinic;
  label: string;
  sortable?: boolean;
};

export default function ClinicsTable({
  clinics = [],
  totalClinics = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
}: ClinicsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (clinics.length > 0 ? Math.ceil(totalClinics / totalPages) : 25);
  const firstClinicOnPage =
    totalClinics > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastClinicOnPage = Math.min(
    currentPage * effectivePageSize,
    totalClinics,
  );

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Clinic Name',
      sortable: false,
    },
    {
      key: 'tier',
      label: 'Tier',
      sortable: false,
    },
    {
      key: 'createdTime',
      label: 'Created',
      sortable: false,
    },
  ];

  const renderCell = React.useCallback(
    (
      item: ClinicianClinicMembership,
      columnKey: keyof Clinic,
    ): React.ReactNode => {
      const clinic = item.clinic;

      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{clinic.name}</p>
              <p className="text-xs text-default-400 font-mono">{clinic.id}</p>
            </div>
          );
        case 'tier':
          return (
            <Chip
              color={clinic.tier === 'tier0300' ? 'primary' : 'default'}
              variant="flat"
              size="sm"
            >
              {clinic.tier || 'N/A'}
            </Chip>
          );
        case 'createdTime':
          return (
            <div className="text-sm">
              {clinic.createdTime
                ? intlFormat(
                    new Date(clinic.createdTime),
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                    { locale },
                  )
                : 'N/A'}
            </div>
          );
        default:
          return String(clinic[columnKey as keyof Clinic] || '');
      }
    },
    [locale],
  );

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Building2 className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">
        No clinics found for this clinician
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading clinics..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Building2 className="h-5 w-5" />}
      title="Clinics"
      totalItems={totalClinics}
      isExpanded={isExpanded}
      onToggle={handleToggleExpand}
      showRange={{
        firstItem: firstClinicOnPage,
        lastItem: lastClinicOnPage,
      }}
      defaultExpanded={false}
    >
      <Table
        aria-label="Clinics table"
        selectionMode="single"
        onSelectionChange={(keys: 'all' | Set<React.Key>) => {
          const key = keys instanceof Set ? Array.from(keys)[0] : keys;
          if (key && key !== 'all') navigate(`/clinics/${key}`);
        }}
        shadow="none"
        removeWrapper
        classNames={collapsibleTableClasses}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={EmptyContent}
          loadingContent={LoadingContent}
          loadingState={isLoading ? 'loading' : 'idle'}
        >
          {clinics.map((item) => (
            <TableRow key={item.clinic?.id || Math.random()}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof Clinic)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-4">
          <Pagination
            showControls
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
          />
        </div>
      )}
    </CollapsibleTableWrapper>
  );
}
