import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Input,
} from '@heroui/react';
import { FileText, Search } from 'lucide-react';
import { intlFormat } from 'date-fns';
import { Link } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { Prescription, PrescriptionState } from './types';

export type PrescriptionsTableProps = {
  prescriptions: Prescription[];
  totalPrescriptions: number;
  isLoading?: boolean;
  clinicId?: string;
  showClinicLink?: boolean;
};

type Column = {
  key: string;
  label: string;
};

export default function PrescriptionsTable({
  prescriptions = [],
  totalPrescriptions = 0,
  isLoading = false,
  clinicId,
  showClinicLink = true,
}: PrescriptionsTableProps) {
  const { locale } = useLocale();
  const [filterValue, setFilterValue] = useState('');

  const filteredPrescriptions = useMemo(() => {
    if (!filterValue.trim()) return prescriptions;
    const searchTerm = filterValue.toLowerCase().trim();
    return prescriptions.filter((prescription) => {
      const attrs = prescription.latestRevision?.attributes;
      const patientName =
        `${attrs?.firstName || ''} ${attrs?.lastName || ''}`.toLowerCase();
      const state = prescription.state?.toLowerCase() || '';
      return patientName.includes(searchTerm) || state.includes(searchTerm);
    });
  }, [prescriptions, filterValue]);

  const topContent = useMemo(
    () => (
      <div className="flex justify-between items-center mb-4">
        <Input
          isClearable
          placeholder="Filter by patient name or state..."
          startContent={<Search className="w-4 h-4 text-default-400" />}
          value={filterValue}
          onClear={() => setFilterValue('')}
          onValueChange={setFilterValue}
          size="sm"
          className="max-w-xs"
        />
      </div>
    ),
    [filterValue],
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

  const getStateColor = (
    state: PrescriptionState,
  ): 'success' | 'warning' | 'danger' | 'default' | 'primary' | 'secondary' => {
    switch (state) {
      case 'active':
        return 'success';
      case 'claimed':
        return 'success';
      case 'submitted':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateStr: string | undefined, includeTime = false) => {
    if (!dateStr) return null;
    return intlFormat(
      new Date(dateStr),
      includeTime
        ? {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          }
        : {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          },
      { locale },
    );
  };

  const getPatientName = (prescription: Prescription): string => {
    const attrs = prescription.latestRevision?.attributes;
    if (attrs?.firstName && attrs?.lastName) {
      return `${attrs.firstName} ${attrs.lastName}`;
    }
    if (attrs?.firstName) return attrs.firstName;
    if (attrs?.lastName) return attrs.lastName;
    return 'N/A';
  };

  const renderCell = React.useCallback(
    (item: Prescription, columnKey: string) => {
      switch (columnKey) {
        case 'patientName': {
          const patientName = getPatientName(item);
          const linkClinicId = clinicId || item.clinicId;

          if (showClinicLink && linkClinicId) {
            return (
              <Link
                to={`/clinics/${linkClinicId}/prescriptions/${item.id}`}
                className="text-primary hover:underline font-medium"
              >
                {patientName}
              </Link>
            );
          }
          return <span className="font-medium">{patientName}</span>;
        }
        case 'state':
          return (
            <Chip
              color={getStateColor(item.state)}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {item.state}
            </Chip>
          );
        case 'createdTime':
          return (
            <span className="text-sm">
              {item.createdTime ? formatDateTime(item.createdTime) : 'N/A'}
            </span>
          );
        case 'expirationTime':
          return (
            <span className="text-sm">
              {item.expirationTime
                ? formatDateTime(item.expirationTime)
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
    [clinicId, locale, showClinicLink],
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <FileText className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">No prescriptions found</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading prescriptions..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<FileText className="h-5 w-5" />}
      title="Prescriptions"
      totalItems={totalPrescriptions}
      defaultExpanded={false}
    >
      {topContent}
      <Table
        aria-label="Prescriptions table"
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
          {filteredPrescriptions.map((item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as string)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}
