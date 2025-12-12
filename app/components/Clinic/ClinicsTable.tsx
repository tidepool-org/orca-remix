import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { Building2 } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type {
  Clinic,
  ClinicianClinicMembership,
  PatientClinicMembership,
} from './types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import TableFilterInput from '~/components/ui/TableFilterInput';
import { formatShortDate } from '~/utils/dateFormatters';

export type ClinicsTableProps = {
  clinics: ClinicianClinicMembership[] | PatientClinicMembership[];
  totalClinics: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  showPermissions?: boolean;
};

type Column = {
  key: keyof Clinic | 'permissions';
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
  showPermissions = false,
}: ClinicsTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [filterValue, setFilterValue] = useState('');

  const filteredClinics = useMemo(() => {
    if (!filterValue.trim()) return clinics;
    const searchTerm = filterValue.toLowerCase().trim();
    return clinics.filter((item) => {
      const clinic = item.clinic;
      const name = clinic.name?.toLowerCase() || '';
      const id = clinic.id?.toLowerCase() || '';
      const tier = clinic.tier?.toLowerCase() || '';
      return (
        name.includes(searchTerm) ||
        id.includes(searchTerm) ||
        tier.includes(searchTerm)
      );
    });
  }, [clinics, filterValue]);

  const topContent = useMemo(
    () => (
      <TableFilterInput
        value={filterValue}
        onChange={setFilterValue}
        placeholder="Filter by clinic name, ID, or tier..."
        aria-label="Filter clinics by name, ID, or tier"
        className="mb-4"
      />
    ),
    [filterValue],
  );

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (clinics.length > 0 ? Math.ceil(totalClinics / totalPages) : 25);
  const firstClinicOnPage = getFirstItemOnPage(
    currentPage,
    effectivePageSize,
    totalClinics,
  );
  const lastClinicOnPage = getLastItemOnPage(
    currentPage,
    effectivePageSize,
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
    ...(showPermissions
      ? [
          {
            key: 'permissions' as const,
            label: 'Permissions',
            sortable: false,
          },
        ]
      : []),
    {
      key: 'createdTime',
      label: 'Created',
      sortable: false,
    },
  ];

  const renderCell = React.useCallback(
    (
      item: ClinicianClinicMembership | PatientClinicMembership,
      columnKey: keyof Clinic | 'permissions',
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
        case 'permissions':
          // Type guard to check if item is PatientClinicMembership
          if ('patient' in item && item.patient.permissions) {
            return (
              <div className="flex gap-1 flex-wrap">
                {item.patient.permissions.view && (
                  <Chip size="sm" variant="flat" color="success">
                    View
                  </Chip>
                )}
                {item.patient.permissions.upload && (
                  <Chip size="sm" variant="flat" color="warning">
                    Upload
                  </Chip>
                )}
                {item.patient.permissions.note && (
                  <Chip size="sm" variant="flat" color="secondary">
                    Note
                  </Chip>
                )}
                {item.patient.permissions.custodian && (
                  <Chip size="sm" variant="flat" color="primary">
                    Custodian
                  </Chip>
                )}
              </div>
            );
          }
          return <span className="text-default-400">—</span>;
        case 'createdTime':
          return (
            <div className="text-sm">
              {clinic.createdTime
                ? formatShortDate(clinic.createdTime, locale)
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
    <TableEmptyState icon={Building2} message="No clinics found" />
  );

  const LoadingContent = <TableLoadingState label="Loading clinics..." />;

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
      {topContent}
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
          {filteredClinics.map((item) => (
            <TableRow key={item.clinic?.id || Math.random()}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof Clinic | 'permissions')}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalClinics}
        pageSize={effectivePageSize}
        onPageChange={onPageChange}
      />
    </CollapsibleTableWrapper>
  );
}
