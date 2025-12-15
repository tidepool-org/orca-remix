import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Database, MoreVertical, Unplug } from 'lucide-react';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import ConfirmationModal from '../ConfirmationModal';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { DataSource } from './types';
import type { ResourceState } from '~/api.types';
import { useToast } from '~/contexts/ToastContext';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TableFilterInput from '~/components/ui/TableFilterInput';
import StatusChip from '~/components/ui/StatusChip';
import ResourceError from '~/components/ui/ResourceError';
import { formatShortDate, formatDateWithTime } from '~/utils/dateFormatters';

export type DataSourcesTableProps = {
  dataSources: DataSource[];
  dataSourcesState?: ResourceState<DataSource[]>;
  totalDataSources: number;
  isLoading?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
};

type Column = {
  key: string;
  label: string;
};

type DisconnectModalState = {
  isOpen: boolean;
  dataSource: DataSource | null;
};

export default function DataSourcesTable({
  dataSources = [],
  dataSourcesState,
  totalDataSources = 0,
  isLoading = false,
  isFirstInGroup = false,
}: DataSourcesTableProps) {
  const { locale } = useLocale();
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [filterValue, setFilterValue] = useState('');
  const [disconnectModal, setDisconnectModal] = useState<DisconnectModalState>({
    isOpen: false,
    dataSource: null,
  });

  const isDisconnecting = fetcher.state !== 'idle';

  const filteredDataSources = useMemo(() => {
    if (!filterValue.trim()) return dataSources;
    const searchTerm = filterValue.toLowerCase().trim();
    return dataSources.filter((dataSource) => {
      const providerName = dataSource.providerName?.toLowerCase() || '';
      const state = dataSource.state?.toLowerCase() || '';
      const dataSourceId = dataSource.dataSourceId?.toLowerCase() || '';
      return (
        providerName.includes(searchTerm) ||
        state.includes(searchTerm) ||
        dataSourceId.includes(searchTerm)
      );
    });
  }, [dataSources, filterValue]);

  const topContent = useMemo(
    () => (
      <TableFilterInput
        value={filterValue}
        onChange={setFilterValue}
        placeholder="Filter by provider or state..."
        aria-label="Filter data sources by provider or state"
        className="mb-4"
      />
    ),
    [filterValue],
  );

  // Handle fetcher response
  React.useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const data = fetcher.data as {
        success: boolean;
        error?: string;
        message?: string;
        action?: string;
      };

      if (data.success) {
        showToast(
          data.message || 'Operation completed successfully',
          'success',
        );
        setDisconnectModal({ isOpen: false, dataSource: null });
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    }
  }, [fetcher.data, fetcher.state, showToast]);

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
      key: 'revision',
      label: 'Revision',
    },
    {
      key: 'dataTimeRange',
      label: 'Data Range',
    },
    {
      key: 'lastImportTime',
      label: 'Last Import',
    },
    {
      key: 'expirationTime',
      label: 'Expires',
    },
    {
      key: 'actions',
      label: 'Actions',
    },
  ];

  const handleDisconnect = (dataSource: DataSource) => {
    setDisconnectModal({ isOpen: true, dataSource });
  };

  const handleConfirmDisconnect = () => {
    if (!disconnectModal.dataSource?.dataSourceId) return;

    const formData = new FormData();
    formData.append('intent', 'disconnect-data-source');
    formData.append('dataSourceId', disconnectModal.dataSource.dataSourceId);

    fetcher.submit(formData, { method: 'post' });
  };

  const handleCloseModal = () => {
    if (!isDisconnecting) {
      setDisconnectModal({ isOpen: false, dataSource: null });
    }
  };

  const renderCell = React.useCallback(
    (item: DataSource, columnKey: string) => {
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
            <StatusChip status={item.state || 'Unknown'} type="dataSource" />
          );
        case 'revision':
          return (
            <span className="text-sm font-mono">
              {item.revision !== undefined ? item.revision : 'N/A'}
            </span>
          );
        case 'dataTimeRange':
          return (
            <div className="flex flex-col gap-0.5 text-sm">
              {item.earliestDataTime || item.latestDataTime ? (
                <>
                  {item.earliestDataTime && (
                    <span className="text-default-500">
                      <span className="text-default-400 text-xs">From:</span>{' '}
                      {formatShortDate(item.earliestDataTime, locale)}
                    </span>
                  )}
                  {item.latestDataTime && (
                    <span className="text-default-500">
                      <span className="text-default-400 text-xs">To:</span>{' '}
                      {formatShortDate(item.latestDataTime, locale)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-default-400">No data</span>
              )}
            </div>
          );
        case 'lastImportTime':
          return (
            <span className="text-sm">
              {item.lastImportTime
                ? formatDateWithTime(item.lastImportTime, locale)
                : 'N/A'}
            </span>
          );
        case 'expirationTime':
          return (
            <span className="text-sm">
              {item.expirationTime
                ? formatShortDate(item.expirationTime, locale)
                : 'N/A'}
            </span>
          );
        case 'actions':
          return (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label="Data source actions"
                >
                  <MoreVertical className="w-4 h-4" aria-hidden="true" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Data source actions">
                <DropdownItem
                  key="disconnect"
                  className="text-danger"
                  color="danger"
                  startContent={
                    <Unplug className="w-4 h-4" aria-hidden="true" />
                  }
                  description="Disconnect this data source"
                  onPress={() => handleDisconnect(item)}
                >
                  Disconnect
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          );
        default:
          return (
            <span className="text-sm">
              {String(item[columnKey as keyof DataSource] ?? 'N/A')}
            </span>
          );
      }
    },
    [locale],
  );

  const EmptyContent = (
    <TableEmptyState icon={Database} message="No data sources found" />
  );

  const LoadingContent = <TableLoadingState label="Loading data sources..." />;

  const getModalContent = () => {
    if (!disconnectModal.dataSource) {
      return { title: '', description: '', confirmText: '' };
    }

    const providerName =
      disconnectModal.dataSource.providerName || 'Unknown Provider';

    return {
      title: 'Disconnect Data Source',
      description: `Are you sure you want to disconnect the ${providerName} data source? This will stop automatic data syncing from this provider. The user will need to re-authenticate to restore the connection.`,
      confirmText: 'Disconnect',
    };
  };

  const modalContent = getModalContent();

  // Check if there's an error state to display
  const hasError = dataSourcesState?.status === 'error';

  return (
    <>
      <CollapsibleTableWrapper
        icon={<Database className="h-5 w-5" />}
        title="Data Sources"
        totalItems={totalDataSources}
        isFirstInGroup={isFirstInGroup}
      >
        {hasError ? (
          <ResourceError
            title="Data Sources"
            message={dataSourcesState.error.message}
          />
        ) : (
          <>
            {topContent}
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
                {filteredDataSources.map((item) => (
                  <TableRow key={item.dataSourceId || item.providerName}>
                    {(columnKey) => (
                      <TableCell>
                        {renderCell(item, columnKey as string)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CollapsibleTableWrapper>

      <ConfirmationModal
        isOpen={disconnectModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDisconnect}
        title={modalContent.title}
        description={modalContent.description}
        confirmText={modalContent.confirmText}
        confirmVariant="danger"
        isLoading={isDisconnecting}
      />
    </>
  );
}
