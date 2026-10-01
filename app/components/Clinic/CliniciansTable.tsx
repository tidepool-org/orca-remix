import React, { useState } from 'react';
import { useNavigate, useParams, useHref } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { UserCheck } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../ui/CollapsibleTableWrapper';
import {
  collapsibleTableClasses,
  columnClass,
  actionsColumnClass,
} from '~/utils/tableStyles';
import { getChipClassNames } from '~/utils/chipStyles';
import type { Clinician } from './types';
import type { ResourceState } from '~/api.types';
import ResourceError from '~/components/ui/ResourceError';
import DebouncedSearchInput from '../ui/DebouncedSearchInput';
import ConfirmationModal from '../ui/ConfirmationModal';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import DeleteActionButton from '~/components/ui/DeleteActionButton';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import { formatShortDate } from '~/utils/dateFormatters';
import { primaryRoleLabel } from '~/utils/clinicians';
import { getSortHeaderProps } from '~/utils/tableRows';
export type CliniciansTableProps = {
  clinicians: Clinician[];
  cliniciansState?: ResourceState<Clinician[]>;
  totalClinicians: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  currentSearch?: string;
  onSort?: (sort: string) => void;
  currentSort?: string;
  onRemoveClinician?: (clinicianId: string) => void;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
};

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

export default function CliniciansTable({
  clinicians,
  cliniciansState,
  totalClinicians = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  onSearch,
  currentSearch,
  onSort,
  currentSort,
  onRemoveClinician,
  isFirstInGroup = false,
}: CliniciansTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  const exportHref = useHref(
    `/clinics/${params.clinicId}/export?type=clinicians`,
  );
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(
    null,
  );

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (clinicians.length > 0 ? Math.ceil(totalClinicians / totalPages) : 25);
  const firstClinicianOnPage = getFirstItemOnPage(
    currentPage,
    effectivePageSize,
    totalClinicians,
  );
  const lastClinicianOnPage = getLastItemOnPage(
    currentPage,
    effectivePageSize,
    totalClinicians,
  );

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Clinician Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'roles',
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

  const sortHeaderProps = getSortHeaderProps({
    currentSort,
    columns: columns.filter((c) => c.sortable).map((c) => c.key),
    onSort,
    descendingFirst: ['createdTime'],
  });

  const handleRemoveClick = (clinician: Clinician) => {
    setSelectedClinician(clinician);
    setRemoveModalOpen(true);
  };

  const handleConfirmRemove = () => {
    if (selectedClinician && onRemoveClinician) {
      onRemoveClinician(selectedClinician.id);
    }
    setRemoveModalOpen(false);
    setSelectedClinician(null);
  };

  const renderCell = React.useCallback(
    (clinician: Clinician, columnKey: string) => {
      const cellValue = clinician[columnKey as keyof Clinician];

      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="font-semibold capitalize text-[color:var(--text-heading)]">
                {cellValue}
              </p>
              <CopyableIdentifier label="ID:" value={clinician.id} size="sm" />
            </div>
          );
        case 'email':
          return <CopyableIdentifier value={cellValue as string} size="sm" />;
        case 'roles': {
          const label = primaryRoleLabel((cellValue as string[]) ?? []);
          return (
            <Chip
              className="capitalize"
              color={label.includes('admin') ? 'primary' : 'default'}
              size="sm"
              variant="flat"
              radius="sm"
              classNames={getChipClassNames(
                label.includes('admin') ? 'primary' : 'default',
              )}
            >
              {label}
            </Chip>
          );
        }
        case 'createdTime':
          return (
            <p className="text-sm">
              {formatShortDate(cellValue as string, locale)}
            </p>
          );
        case 'actions':
          return (
            <div className="flex justify-end">
              <DeleteActionButton
                tooltip="Remove clinician"
                ariaLabel="Remove clinician"
                onPress={() => handleRemoveClick(clinician)}
                isDisabled={!onRemoveClinician}
              />
            </div>
          );
        default:
          return cellValue;
      }
    },
    [locale, onRemoveClinician],
  );

  const EmptyContent = (
    <TableEmptyState
      icon={UserCheck}
      message="No clinicians found for this clinic"
    />
  );

  const LoadingContent = <TableLoadingState label="Loading clinicians..." />;

  return (
    <>
      <CollapsibleTableWrapper
        icon={<UserCheck className="h-5 w-5" />}
        title="Clinicians"
        totalItems={totalClinicians}
        isFirstInGroup={isFirstInGroup}
        exportHref={exportHref}
        showRange={{
          firstItem: firstClinicianOnPage,
          lastItem: lastClinicianOnPage,
        }}
      >
        {cliniciansState?.status === 'error' ? (
          <ResourceError
            title="Clinicians"
            message={cliniciansState.error.message}
          />
        ) : (
          <>
            {/* Search Controls */}
            <div className="flex justify-start mb-4">
              <DebouncedSearchInput
                placeholder="Search clinicians..."
                value={currentSearch || ''}
                onSearch={(value) => onSearch?.(value)}
                debounceMs={1000}
              />
            </div>

            <Table
              aria-label="Clinic clinicians table"
              className="flex flex-1 flex-col text-[color:var(--text)]"
              shadow="none"
              removeWrapper
              selectionMode="single"
              onSelectionChange={(keys: 'all' | Set<React.Key>) => {
                const key = keys instanceof Set ? Array.from(keys)[0] : keys;
                if (key && key !== 'all') {
                  navigate(`/clinics/${params.clinicId}/clinicians/${key}`);
                }
              }}
              classNames={collapsibleTableClasses}
              {...sortHeaderProps}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    allowsSorting={column.sortable}
                    className={
                      column.key === 'actions'
                        ? actionsColumnClass
                        : columnClass
                    }
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
                      <TableCell>
                        {renderCell(clinician, columnKey as string)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalClinicians}
              pageSize={effectivePageSize}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CollapsibleTableWrapper>

      <ConfirmationModal
        isOpen={removeModalOpen}
        onClose={() => {
          setRemoveModalOpen(false);
          setSelectedClinician(null);
        }}
        onConfirm={handleConfirmRemove}
        title="Remove Clinician"
        description={`Are you sure you want to remove ${selectedClinician?.name || 'this clinician'} from this clinic? They will lose access to all clinic data and patients.`}
        confirmText="Remove Clinician"
        confirmVariant="danger"
      />
    </>
  );
}
