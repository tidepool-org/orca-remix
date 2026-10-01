/* eslint-disable react/prop-types */
import React from 'react';
import { useNavigate, useParams, useHref } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
} from '@heroui/react';
import { Users } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import useClinicResolvers from '~/hooks/useClinicResolvers';
import CollapsibleTableWrapper from '../ui/CollapsibleTableWrapper';
import { collapsibleTableClasses, columnClass } from '~/utils/tableStyles';
import { getChipClassNames } from '~/utils/chipStyles';
import type { Patient } from './types';
import type { ResourceState } from '~/api.types';
import ResourceError from '~/components/ui/ResourceError';
import DebouncedSearchInput from '../ui/DebouncedSearchInput';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import { formatShortDate } from '~/utils/dateFormatters';
import { getSortHeaderProps } from '~/utils/tableRows';

export type PatientsTableProps = {
  patients: Patient[];
  patientsState?: ResourceState<Patient[]>;
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
  patientsState,
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
  const exportHref = useHref(
    `/clinics/${params.clinicId}/export?type=patients`,
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
      sortable: true,
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

  const sortHeaderProps = getSortHeaderProps({
    currentSort,
    columns: columns.filter((c) => c.sortable).map((c) => c.key),
    onSort,
    // The API orders by fullName ascending when no sort is sent
    defaultSort: { column: 'fullName', direction: 'ascending' },
  });

  const renderCell = React.useCallback(
    (patient: Patient, columnKey: keyof Patient) => {
      switch (columnKey) {
        case 'fullName':
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold capitalize text-[color:var(--text-heading)]">
                  {patient.fullName}
                </p>
                {patient.permissions?.custodian && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    radius="sm"
                    classNames={getChipClassNames('warning')}
                  >
                    Custodial
                  </Chip>
                )}
              </div>
              <CopyableIdentifier label="ID:" value={patient.id} size="sm" />
            </div>
          );
        case 'email':
          return <CopyableIdentifier value={patient.email ?? ''} size="sm" />;
        case 'birthDate':
          return patient.birthDate ? (
            <p className="text-sm">
              {formatShortDate(patient.birthDate, locale)}
            </p>
          ) : (
            <span className="text-[color:var(--text-faint)]">—</span>
          );
        case 'mrn':
          return patient.mrn ? (
            <p className="text-sm font-mono">{patient.mrn}</p>
          ) : (
            <span className="text-[color:var(--text-faint)]">—</span>
          );
        case 'tags':
          return patient.tags && patient.tags.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {patient.tags.slice(0, 2).map((tagId: string, index: number) => (
                <Chip
                  key={index}
                  size="sm"
                  variant="flat"
                  color="primary"
                  radius="sm"
                  classNames={getChipClassNames('primary')}
                >
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
                              radius="sm"
                              classNames={getChipClassNames('primary')}
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
                    radius="sm"
                    className="cursor-help"
                    classNames={getChipClassNames('default')}
                  >
                    +{patient.tags.length - 2}
                  </Chip>
                </Tooltip>
              )}
            </div>
          ) : (
            <span className="text-[color:var(--text-faint)]">—</span>
          );
        case 'sites':
          return patient.sites && patient.sites.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {patient.sites.slice(0, 2).map((site, index: number) => (
                <Chip
                  key={index}
                  size="sm"
                  variant="flat"
                  color="secondary"
                  radius="sm"
                  classNames={getChipClassNames('secondary')}
                >
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
                            radius="sm"
                            classNames={getChipClassNames('secondary')}
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
                    radius="sm"
                    className="cursor-help"
                    classNames={getChipClassNames('default')}
                  >
                    +{patient.sites.length - 2}
                  </Chip>
                </Tooltip>
              )}
            </div>
          ) : (
            <span className="text-[color:var(--text-faint)]">—</span>
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
      exportHref={exportHref}
      showRange={{
        firstItem: firstPatientOnPage,
        lastItem: lastPatientOnPage,
      }}
    >
      {patientsState?.status === 'error' ? (
        <ResourceError title="Patients" message={patientsState.error.message} />
      ) : (
        <>
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
            className="flex flex-1 flex-col text-[color:var(--text)]"
            shadow="none"
            removeWrapper
            selectionMode="single"
            onSelectionChange={(keys: 'all' | Set<React.Key>) => {
              const key = keys instanceof Set ? Array.from(keys)[0] : keys;
              if (key && key !== 'all') {
                navigate(`/clinics/${params.clinicId}/patients/${key}`);
              }
            }}
            {...sortHeaderProps}
            classNames={collapsibleTableClasses}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  allowsSorting={column.sortable}
                  className={columnClass}
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
        </>
      )}
    </CollapsibleTableWrapper>
  );
}
