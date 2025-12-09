import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Upload, MoreVertical, Trash2, Database } from 'lucide-react';
import { intlFormat } from 'date-fns';
import { useFetcher } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import ConfirmationModal from '../ConfirmationModal';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { DataSet } from './types';
import { useToast } from '~/contexts/ToastContext';

export type DataSetsTableProps = {
  dataSets: DataSet[];
  totalDataSets: number;
  isLoading?: boolean;
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
  totalDataSets = 0,
  isLoading = false,
}: DataSetsTableProps) {
  const { locale } = useLocale();
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    dataSet: null,
    type: null,
  });

  const isDeleting = fetcher.state !== 'idle';

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
        case 'actions': {
          const menuItems = [
            <DropdownItem
              key="delete-dataset"
              className="text-danger"
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
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
                startContent={<Database className="w-4 h-4" />}
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
                <Button isIconOnly size="sm" variant="light">
                  <MoreVertical className="w-4 h-4" />
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

  return (
    <>
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
                  <TableCell>{renderCell(item, columnKey as string)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
