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
} from '@nextui-org/react';
import { Database } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
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

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Database className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">No data sources found</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading data sources..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Database className="h-5 w-5" />}
      title="Data Sources"
      totalItems={totalDataSources}
      defaultExpanded={false}
    >
      <Table
        aria-label="Data sources table"
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
          {dataSources.map((item) => (
            <TableRow key={item.dataSourceId || item.providerName}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof DataSource)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}
