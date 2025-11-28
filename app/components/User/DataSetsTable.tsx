import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
} from '@nextui-org/react';
import { ChevronDown, Upload } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
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
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Generate header text based on expanded state
  const headerText = `Data Uploads (${totalDataSets})`;

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

  if (totalDataSets === 0 && !isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{headerText}</h2>
        </div>
        <p className="text-default-400">No data uploads found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{headerText}</h2>
        </div>
        {totalDataSets > 5 && (
          <Button
            variant="light"
            size="sm"
            endContent={
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            }
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show All'}
          </Button>
        )}
      </div>

      <Table
        aria-label="Data uploads table"
        classNames={{
          base: 'flex flex-1 flex-col text-content1-foreground gap-4',
          th: 'bg-content1',
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={isExpanded ? dataSets : dataSets.slice(0, 5)}
          isLoading={isLoading}
          emptyContent="No data uploads found"
        >
          {(item) => (
            <TableRow key={item.uploadId || item.time}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof DataSet)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
