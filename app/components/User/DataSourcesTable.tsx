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
import { ChevronDown, Database } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { DataSource } from './types';

export type DataSourcesTableProps = {
  dataSources: DataSource[];
  totalDataSources: number;
  isLoading?: boolean;
};

type Column = {
  key: string;
  label: string;
};

export default function DataSourcesTable({
  dataSources = [],
  totalDataSources = 0,
  isLoading = false,
}: DataSourcesTableProps) {
  const { locale } = useLocale();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Generate header text based on expanded state
  const headerText = `Data Sources (${totalDataSources})`;

  const columns: Column[] = [
    {
      key: 'providerName',
      label: 'Provider',
    },
    {
      key: 'state',
      label: 'State',
    },
    {
      key: 'modifiedTime',
      label: 'Modified',
    },
    {
      key: 'expirationTime',
      label: 'Expires',
    },
  ];

  const getStateColor = (
    state: string,
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (state?.toLowerCase()) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'danger';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  const renderCell = React.useCallback(
    (item: DataSource, columnKey: keyof DataSource) => {
      switch (columnKey) {
        case 'providerName':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">
                {item.providerName || 'N/A'}
              </p>
              {item.dataSourceId && (
                <p className="text-xs text-default-400 font-mono">
                  {item.dataSourceId}
                </p>
              )}
            </div>
          );
        case 'state':
          return (
            <Chip
              color={getStateColor(item.state || '')}
              variant="flat"
              size="sm"
              className="capitalize"
            >
              {item.state || 'Unknown'}
            </Chip>
          );
        case 'modifiedTime':
          return (
            <span className="text-sm">
              {item.modifiedTime
                ? intlFormat(
                    new Date(item.modifiedTime),
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
        case 'expirationTime':
          return (
            <span className="text-sm">
              {item.expirationTime
                ? intlFormat(
                    new Date(item.expirationTime),
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
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

  if (totalDataSources === 0 && !isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{headerText}</h2>
        </div>
        <p className="text-default-400">No data sources found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{headerText}</h2>
        </div>
        {totalDataSources > 5 && (
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
        aria-label="Data sources table"
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
          items={isExpanded ? dataSources : dataSources.slice(0, 5)}
          isLoading={isLoading}
          emptyContent="No data sources found"
        >
          {(item) => (
            <TableRow key={item.dataSourceId || item.providerName}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof DataSource)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
