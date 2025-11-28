import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import { Upload } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { DataSet } from './types';

export type DataSetsTableProps = {
  dataSets: DataSet[];
  totalDataSets: number;
  isLoading?: boolean;
};

type Column = {
  key: string;
  label: string;
};

export default function DataSetsTable({
  dataSets = [],
  totalDataSets = 0,
  isLoading = false,
}: DataSetsTableProps) {
  const { locale } = useLocale();

  const columns: Column[] = [
    {
      key: 'deviceModel',
      label: 'Device Model',
    },
    {
      key: 'deviceManufacturers',
      label: 'Manufacturer',
    },
    {
      key: 'dataSetType',
      label: 'Type',
    },
    {
      key: 'time',
      label: 'Upload Time',
    },
  ];

  const renderCell = React.useCallback(
    (item: DataSet, columnKey: keyof DataSet) => {
      switch (columnKey) {
        case 'deviceModel':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{item.deviceModel || 'N/A'}</p>
              {item.deviceSerialNumber && (
                <p className="text-xs text-default-400 font-mono">
                  SN: {item.deviceSerialNumber}
                </p>
              )}
            </div>
          );
        case 'deviceManufacturers':
          return (
            <span className="text-sm">
              {item.deviceManufacturers?.join(', ') || 'N/A'}
            </span>
          );
        case 'dataSetType':
          return (
            <Chip color="primary" variant="flat" size="sm">
              {item.dataSetType}
            </Chip>
          );
        case 'time':
          return (
            <span className="text-sm">
              {item.time
                ? intlFormat(
                    new Date(item.time),
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    },
                    { locale },
                  )
                : 'N/A'}
            </span>
          );
        default:
          return <span className="text-sm">{String(item[columnKey])}</span>;
      }
    },
    [locale],
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Upload className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">No data uploads found</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading data uploads..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Upload className="h-5 w-5" />}
      title="Data Uploads"
      totalItems={totalDataSets}
      defaultExpanded={false}
    >
      <Table
        aria-label="Data uploads table"
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
          {dataSets.map((item) => (
            <TableRow key={item.uploadId || item.time}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof DataSet)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}
