import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { Prescription } from './types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TableFilterInput from '~/components/ui/TableFilterInput';
import StatusChip from '~/components/ui/StatusChip';
import { formatDateTime } from '~/utils/dateFormatters';

export type PrescriptionsTableProps = {
  prescriptions: Prescription[];
  totalPrescriptions: number;
  isLoading?: boolean;
  clinicId?: string;
  showClinicLink?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
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
  isFirstInGroup = false,
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
      <TableFilterInput
        value={filterValue}
        onChange={setFilterValue}
        placeholder="Filter by patient name or state..."
        aria-label="Filter prescriptions by patient name or state"
        className="mb-4"
      />
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
    [clinicId, locale, showClinicLink],
  );

  const EmptyContent = (
    <TableEmptyState icon={FileText} message="No prescriptions found" />
  );

  const LoadingContent = <TableLoadingState label="Loading prescriptions..." />;

  return (
    <CollapsibleTableWrapper
      icon={<FileText className="h-5 w-5" />}
      title="Prescriptions"
      totalItems={totalPrescriptions}
      isFirstInGroup={isFirstInGroup}
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
