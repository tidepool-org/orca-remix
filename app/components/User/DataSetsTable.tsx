import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Upload, MoreVertical, Trash2, Database } from 'lucide-react';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import ConfirmationModal from '../ConfirmationModal';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { DataSet } from './types';
import type { ResourceState } from '~/api.types';
import { useToast } from '~/contexts/ToastContext';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TableFilterInput from '~/components/ui/TableFilterInput';
import ResourceError from '~/components/ui/ResourceError';
import { formatDateWithTime } from '~/utils/dateFormatters';

export type DataSetsTableProps = {
  dataSets: DataSet[];
  dataSetsState?: ResourceState<DataSet[]>;
  totalDataSets: number;
  isLoading?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
};

type Column = {
  key: string;
  label: string;
};

type DeleteModalState = {
  isOpen: boolean;
  dataSet: DataSet | null;
  type: 'dataset' | 'data' | null;
};

export default function DataSetsTable({
  dataSets = [],
  dataSetsState,
  totalDataSets = 0,
  isLoading = false,
  isFirstInGroup = false,
}: DataSetsTableProps) {
  const { locale } = useLocale();
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    dataSet: null,
    type: null,
  });
  const [filterValue, setFilterValue] = useState('');

  const isDeleting = fetcher.state !== 'idle';

  // Filter datasets by upload ID
  const filteredDataSets = useMemo(() => {
    if (!filterValue.trim()) return dataSets;
    const searchTerm = filterValue.toLowerCase().trim();
    return dataSets.filter(
      (ds) =>
        ds.uploadId?.toLowerCase().includes(searchTerm) ||
        ds.deviceModel?.toLowerCase().includes(searchTerm) ||
        ds.deviceSerialNumber?.toLowerCase().includes(searchTerm),
    );
  }, [dataSets, filterValue]);

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
        setDeleteModal({ isOpen: false, dataSet: null, type: null });
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    }
  }, [fetcher.data, fetcher.state, showToast]);

  const columns: Column[] = [
    {
      key: 'uploadId',
      label: 'Upload ID',
    },
    {
      key: 'deviceModel',
      label: 'Device',
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
    {
      key: 'version',
      label: 'Version',
    },
    {
      key: 'actions',
      label: 'Actions',
    },
  ];

  const handleDeleteDataSet = (dataSet: DataSet) => {
    setDeleteModal({ isOpen: true, dataSet, type: 'dataset' });
  };

  const handleDeleteDataFromDataSet = (dataSet: DataSet) => {
    setDeleteModal({ isOpen: true, dataSet, type: 'data' });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.dataSet || !deleteModal.type) return;

    const formData = new FormData();
    formData.append(
      'intent',
      deleteModal.type === 'dataset' ? 'delete-dataset' : 'delete-dataset-data',
    );
    formData.append('dataSetId', deleteModal.dataSet.uploadId);

    fetcher.submit(formData, { method: 'post' });
  };

  const handleCloseModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, dataSet: null, type: null });
    }
  };

  const renderCell = React.useCallback(
    (item: DataSet, columnKey: string) => {
      switch (columnKey) {
        case 'uploadId':
          return item.uploadId ? (
            <CopyableIdentifier
              value={item.uploadId}
              truncate
              maxWidth="120px"
              monospace
              size="sm"
            >
              <span className="text-xs font-mono text-default-500 truncate max-w-[120px]">
                {item.uploadId.slice(0, 8)}...
              </span>
            </CopyableIdentifier>
          ) : (
            <span className="text-xs text-default-500">N/A</span>
          );
        case 'deviceModel':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{item.deviceModel || 'N/A'}</p>
              {item.deviceSerialNumber && (
                <p className="text-xs text-default-400 font-mono">
                  SN: {item.deviceSerialNumber}
                </p>
              )}
              {item.deviceTags && item.deviceTags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {item.deviceTags.map((tag) => (
                    <Chip key={tag} size="sm" variant="flat" color="default">
                      {tag}
                    </Chip>
                  ))}
                </div>
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
            <Chip
              color={item.dataSetType === 'continuous' ? 'success' : 'primary'}
              variant="flat"
              size="sm"
            >
              {item.dataSetType}
            </Chip>
          );
        case 'time':
          return (
            <div className="flex flex-col">
              <span className="text-sm">
                {item.time ? formatDateWithTime(item.time, locale) : 'N/A'}
              </span>
              {item.byUser && (
                <p className="text-xs text-default-400">
                  by: {item.byUser.slice(0, 8)}...
                </p>
              )}
            </div>
          );
        case 'version':
          return (
            <span className="text-xs text-default-500">
              {item.version || 'N/A'}
            </span>
          );
        case 'actions': {
          const menuItems = [
            <DropdownItem
              key="delete-dataset"
              className="text-danger"
              color="danger"
              startContent={<Trash2 className="w-4 h-4" aria-hidden="true" />}
              description="Delete entire dataset"
              onPress={() => handleDeleteDataSet(item)}
            >
              Delete Dataset
            </DropdownItem>,
          ];

          if (item.dataSetType === 'continuous') {
            menuItems.push(
              <DropdownItem
                key="delete-data"
                className="text-danger"
                color="danger"
                startContent={
                  <Database className="w-4 h-4" aria-hidden="true" />
                }
                description="Delete data from continuous dataset"
                onPress={() => handleDeleteDataFromDataSet(item)}
              >
                Delete Data from Dataset
              </DropdownItem>,
            );
          }

          return (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label="Dataset actions"
                >
                  <MoreVertical className="w-4 h-4" aria-hidden="true" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Dataset actions">
                {menuItems}
              </DropdownMenu>
            </Dropdown>
          );
        }
        default:
          return (
            <span className="text-sm">
              {String(item[columnKey as keyof DataSet] ?? '')}
            </span>
          );
      }
    },
    [locale],
  );

  const EmptyContent = (
    <TableEmptyState icon={Upload} message="No data uploads found" />
  );

  const LoadingContent = <TableLoadingState label="Loading data uploads..." />;

  const getModalContent = () => {
    if (!deleteModal.dataSet || !deleteModal.type) {
      return { title: '', description: '', confirmText: '' };
    }

    const deviceInfo = deleteModal.dataSet.deviceModel || 'Unknown Device';
    const uploadId = deleteModal.dataSet.uploadId;

    if (deleteModal.type === 'dataset') {
      return {
        title: 'Delete Dataset',
        description: `Are you sure you want to delete this dataset from ${deviceInfo}? This will permanently remove all data associated with upload ID: ${uploadId}. This action cannot be undone.`,
        confirmText: 'Delete Dataset',
      };
    }

    return {
      title: 'Delete Data from Dataset',
      description: `Are you sure you want to delete all data from this continuous dataset (${deviceInfo})? The dataset record will remain, but all associated data will be permanently removed. This action cannot be undone.`,
      confirmText: 'Delete Data',
    };
  };

  const modalContent = getModalContent();

  const topContent = React.useMemo(() => {
    return (
      <TableFilterInput
        value={filterValue}
        onChange={setFilterValue}
        placeholder="Filter by Upload ID, Device, or Serial..."
        aria-label="Filter uploads by Upload ID, Device, or Serial"
        showResultCount={filterValue !== ''}
        filteredCount={filteredDataSets.length}
        totalCount={totalDataSets}
        itemLabel="uploads"
        maxWidth="w-full sm:max-w-[300px]"
        className="mb-4"
      />
    );
  }, [filterValue, filteredDataSets.length, totalDataSets]);

  // Check if there's an error state to display
  const hasError = dataSetsState?.status === 'error';

  return (
    <>
      <CollapsibleTableWrapper
        icon={<Upload className="h-5 w-5" />}
        title="Data Uploads"
        totalItems={totalDataSets}
        isFirstInGroup={isFirstInGroup}
      >
        {hasError ? (
          <ResourceError
            title="Data Uploads"
            message={dataSetsState.error.message}
          />
        ) : (
          <>
            {topContent}
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
                {filteredDataSets.map((item) => (
                  <TableRow key={item.uploadId || item.time}>
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
        isOpen={deleteModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title={modalContent.title}
        description={modalContent.description}
        confirmText={modalContent.confirmText}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
