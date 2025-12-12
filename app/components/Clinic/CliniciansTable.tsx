import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Button,
  Tooltip,
} from '@heroui/react';
import { UserCheck, Trash2 } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { Clinician } from './types';
import DebouncedSearchInput from '../DebouncedSearchInput';
import ConfirmationModal from '../ConfirmationModal';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import { formatShortDate } from '~/utils/dateFormatters';
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
  onRemoveClinician?: (clinicianId: string) => void;
};

type Column = {
  key: string;
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
  onRemoveClinician,
}: CliniciansTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const params = useParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(
    null,
  );

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (clinicians.length > 0 ? Math.ceil(totalClinicians / totalPages) : 25);
  const firstClinicianOnPage =
    totalClinicians > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastClinicianOnPage = Math.min(
    currentPage * effectivePageSize,
    totalClinicians,
  );

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
              <p className="text-bold text-sm capitalize">{cellValue}</p>
              <p className="text-tiny text-default-400 capitalize">
                ID: {clinician.id}
              </p>
            </div>
          );
        case 'email':
          return <p className="text-sm text-default-600">{cellValue}</p>;
        case 'roles': {
          // Handle roles array - display the first role or join them
          const rolesArray = cellValue as string[];
          const primaryRole =
            rolesArray && rolesArray.length > 0 ? rolesArray[0] : 'Unknown';
          return (
            <Chip
              className="capitalize"
              color={
                primaryRole.toLowerCase().includes('admin')
                  ? 'primary'
                  : 'default'
              }
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
              {formatShortDate(cellValue as string, locale)}
            </p>
          );
        case 'actions':
          return (
            <Tooltip content="Remove clinician" color="danger">
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                onPress={() => handleRemoveClick(clinician)}
                aria-label="Remove clinician"
                isDisabled={!onRemoveClinician}
              >
                <Trash2 size={16} />
              </Button>
            </Tooltip>
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
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        showRange={{
          firstItem: firstClinicianOnPage,
          lastItem: lastClinicianOnPage,
        }}
        defaultExpanded={false}
      >
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
          className="flex flex-1 flex-col text-content1-foreground gap-4"
          shadow="none"
          removeWrapper
          selectionMode="single"
          onSelectionChange={(keys: 'all' | Set<React.Key>) => {
            const key = keys instanceof Set ? Array.from(keys)[0] : keys;
            if (key && key !== 'all')
              navigate(`/clinics/${params.clinicId}/clinicians/${key}`);
          }}
          classNames={collapsibleTableClasses}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} className="text-left">
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
