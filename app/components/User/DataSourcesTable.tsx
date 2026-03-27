import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@heroui/react';
import { Database, Unplug, Send } from 'lucide-react';
import { useFetcher, useParams } from 'react-router';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import ConfirmationModal from '../ConfirmationModal';
import {
  collapsibleTableClasses,
  columnClass,
  actionsColumnClass,
} from '~/utils/tableStyles';
import type { DataSource, ConnectionRequest } from './types';
import type { ResourceState } from '~/api.types';
import { useToast } from '~/contexts/ToastContext';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';

import StatusChip from '~/components/ui/StatusChip';
import ResourceError from '~/components/ui/ResourceError';
import { formatShortDate, formatTimeOnly } from '~/utils/dateFormatters';

/** All known C2C providers that support connection invites */
const C2C_PROVIDERS = ['dexcom', 'twiist', 'abbott'] as const;

export type DataSourcesTableProps = {
  dataSources: DataSource[];
  connectionRequests?: ConnectionRequest[];
  dataSourcesState?: ResourceState<DataSource[]>;
  totalDataSources: number;
  isLoading?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
  /** Whether the patient has an email address (required for sending invites) */
  patientHasEmail?: boolean;
  /** Clinic ID for sending connection invites (only available in clinic context) */
  clinicId?: string;
};

type Column = {
  key: string;
  label: string;
};

type DisconnectModalState = {
  isOpen: boolean;
  dataSource: DataSource | null;
};

type InviteModalState = {
  isOpen: boolean;
  providerName: string | null;
  isResend: boolean;
};

export default function DataSourcesTable({
  dataSources = [],
  connectionRequests = [],
  dataSourcesState,
  totalDataSources = 0,
  isLoading = false,
  isFirstInGroup = false,
  patientHasEmail = false,
  clinicId,
}: DataSourcesTableProps) {
  const { locale } = useLocale();
  const { userId, patientId } = useParams();
  const disconnectFetcher = useFetcher({ key: 'disconnect-data-source' });
  const inviteFetcher = useFetcher({ key: 'send-connect-request' });
  const { showToast } = useToast();
  const [disconnectModal, setDisconnectModal] = useState<DisconnectModalState>({
    isOpen: false,
    dataSource: null,
  });
  const [inviteModal, setInviteModal] = useState<InviteModalState>({
    isOpen: false,
    providerName: null,
    isResend: false,
  });

  const isDisconnecting = disconnectFetcher.state !== 'idle';
  const isSendingInvite = inviteFetcher.state !== 'idle';

  // Whether invite actions are available (requires clinic context + patient email)
  const canSendInvites = !!clinicId && patientHasEmail;

  // Merge connection requests into the data sources list as synthetic entries
  // Only include connection requests for providers that don't already have a data source
  const mergedDataSources = useMemo(() => {
    const existingProviders = new Set(
      dataSources.map((ds) => ds.providerName?.toLowerCase()).filter(Boolean),
    );

    const syntheticSources: DataSource[] = connectionRequests
      .filter((cr) => !existingProviders.has(cr.providerName.toLowerCase()))
      .map((cr) => ({
        dataSourceId: `invite-${cr.providerName}-${cr.createdTime}`,
        providerName: cr.providerName,
        state: 'invite sent',
        modifiedTime: cr.createdTime,
      }));

    return [...dataSources, ...syntheticSources];
  }, [dataSources, connectionRequests]);

  const totalItems =
    totalDataSources + mergedDataSources.length - dataSources.length;

  // Providers that have no existing connection or invite — available for new invites
  const availableProviders = useMemo(() => {
    if (!canSendInvites) return [];
    const existingProviders = new Set(
      mergedDataSources
        .map((ds) => ds.providerName?.toLowerCase())
        .filter(Boolean),
    );
    return C2C_PROVIDERS.filter((p) => !existingProviders.has(p));
  }, [mergedDataSources, canSendInvites]);

  // Handle disconnect fetcher response
  React.useEffect(() => {
    if (disconnectFetcher.data && disconnectFetcher.state === 'idle') {
      const data = disconnectFetcher.data as {
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
  }, [disconnectFetcher.data, disconnectFetcher.state, showToast]);

  // Handle invite fetcher response
  React.useEffect(() => {
    if (inviteFetcher.data && inviteFetcher.state === 'idle') {
      const data = inviteFetcher.data as {
        success: boolean;
        error?: string;
        message?: string;
        action?: string;
      };

      if (data.success) {
        showToast(
          data.message || 'Connection invite sent successfully',
          'success',
        );
        setInviteModal({ isOpen: false, providerName: null, isResend: false });
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    }
  }, [inviteFetcher.data, inviteFetcher.state, showToast]);

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
      key: 'createdTime',
      label: 'Created Connection',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Connection',
    },
    {
      key: 'lastImportTime',
      label: 'Last Import',
    },
    {
      key: 'latestDataTime',
      label: 'Latest Data',
    },
    {
      key: 'earliestDataTime',
      label: 'Earliest Data',
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
    if (!disconnectModal.dataSource?.providerName) return;

    const targetUserId = userId || patientId;
    const formData = new FormData();
    formData.append('intent', 'disconnect-data-source');
    formData.append('providerName', disconnectModal.dataSource.providerName);

    disconnectFetcher.submit(formData, {
      method: 'post',
      action: `/users/${targetUserId}`,
    });
  };

  const handleCloseDisconnectModal = () => {
    if (!isDisconnecting) {
      setDisconnectModal({ isOpen: false, dataSource: null });
    }
  };

  const handleSendInvite = (providerName: string, isResend: boolean) => {
    setInviteModal({ isOpen: true, providerName, isResend });
  };

  const handleConfirmSendInvite = () => {
    if (!inviteModal.providerName || !clinicId) return;

    const targetPatientId = patientId || userId;
    const formData = new FormData();
    formData.append('intent', 'send-connect-request');
    formData.append('providerName', inviteModal.providerName);
    formData.append('isResend', inviteModal.isResend ? 'true' : 'false');

    inviteFetcher.submit(formData, {
      method: 'post',
      action: `/clinics/${clinicId}/patients/${targetPatientId}`,
    });
  };

  const handleCloseInviteModal = () => {
    if (!isSendingInvite) {
      setInviteModal({ isOpen: false, providerName: null, isResend: false });
    }
  };

  const renderActionButton = (item: DataSource) => {
    const state = item.state?.toLowerCase();

    // Connected sources: show Disconnect button
    if (state === 'connected') {
      return (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Unplug className="w-3.5 h-3.5" aria-hidden="true" />}
            onPress={() => handleDisconnect(item)}
            aria-label={`Disconnect ${item.providerName || 'data source'}`}
          >
            Disconnect
          </Button>
        </div>
      );
    }

    // Disconnected or error sources: show Send Invite button (if allowed)
    if (state === 'disconnected' || state === 'error') {
      if (!canSendInvites) return null;
      return (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Send className="w-3.5 h-3.5" aria-hidden="true" />}
            onPress={() => handleSendInvite(item.providerName || '', false)}
            aria-label={`Send invite for ${item.providerName || 'data source'}`}
          >
            Send Invite
          </Button>
        </div>
      );
    }

    // Invite sent: show Resend Invite button (if allowed)
    if (state === 'invite sent') {
      if (!canSendInvites) return null;
      return (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Send className="w-3.5 h-3.5" aria-hidden="true" />}
            onPress={() => handleSendInvite(item.providerName || '', true)}
            aria-label={`Resend invite for ${item.providerName || 'data source'}`}
          >
            Resend Invite
          </Button>
        </div>
      );
    }

    return null;
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
              {item.dataSourceId &&
                !item.dataSourceId.startsWith('invite-') && (
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
        case 'createdTime':
        case 'modifiedTime':
        case 'lastImportTime':
        case 'latestDataTime':
        case 'earliestDataTime': {
          const value = item[columnKey as keyof DataSource] as
            | string
            | undefined;
          if (!value) return <span className="text-sm">N/A</span>;
          return (
            <div className="flex flex-col text-sm">
              <span>{formatShortDate(value, locale)}</span>
              <span className="text-default-400">
                {formatTimeOnly(value, locale)}
              </span>
            </div>
          );
        }
        case 'actions':
          return renderActionButton(item);
        default:
          return (
            <span className="text-sm">
              {String(item[columnKey as keyof DataSource] ?? 'N/A')}
            </span>
          );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, canSendInvites],
  );

  const EmptyContent = (
    <TableEmptyState icon={Database} message="No data sources found" />
  );

  const LoadingContent = <TableLoadingState label="Loading data sources..." />;

  const getDisconnectModalContent = () => {
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

  const getInviteModalContent = () => {
    if (!inviteModal.providerName) {
      return { title: '', description: '', confirmText: '' };
    }

    const providerName = inviteModal.providerName;
    const action = inviteModal.isResend ? 'Resend' : 'Send';

    return {
      title: `${action} Connection Invite`,
      description: `This will send a connection invite to the patient's email address for ${providerName}. The patient will receive an email with instructions to connect their ${providerName} account.`,
      confirmText: `${action} Invite`,
    };
  };

  const disconnectModalContent = getDisconnectModalContent();
  const inviteModalContent = getInviteModalContent();

  // Check if there's an error state to display
  const hasError = dataSourcesState?.status === 'error';

  return (
    <>
      <CollapsibleTableWrapper
        icon={<Database className="h-5 w-5" />}
        title="Data Sources"
        totalItems={totalItems}
        isFirstInGroup={isFirstInGroup}
      >
        {hasError ? (
          <ResourceError
            title="Data Sources"
            message={dataSourcesState.error.message}
          />
        ) : (
          <>
            {availableProviders.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-default-500">Send invite:</span>
                {availableProviders.map((provider) => (
                  <Button
                    key={provider}
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    }
                    onPress={() => handleSendInvite(provider, false)}
                    aria-label={`Send connection invite for ${provider}`}
                    className="capitalize"
                  >
                    {provider}
                  </Button>
                ))}
              </div>
            )}
            <Table
              aria-label="Data sources table"
              shadow="none"
              removeWrapper
              classNames={collapsibleTableClasses}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    className={
                      column.key === 'actions'
                        ? actionsColumnClass
                        : columnClass
                    }
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={EmptyContent}
                loadingContent={LoadingContent}
                loadingState={isLoading ? 'loading' : 'idle'}
              >
                {mergedDataSources.map((item) => (
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
        onClose={handleCloseDisconnectModal}
        onConfirm={handleConfirmDisconnect}
        title={disconnectModalContent.title}
        description={disconnectModalContent.description}
        confirmText={disconnectModalContent.confirmText}
        confirmVariant="danger"
        isLoading={isDisconnecting}
      />

      <ConfirmationModal
        isOpen={inviteModal.isOpen}
        onClose={handleCloseInviteModal}
        onConfirm={handleConfirmSendInvite}
        title={inviteModalContent.title}
        description={inviteModalContent.description}
        confirmText={inviteModalContent.confirmText}
        confirmVariant="primary"
        isLoading={isSendingInvite}
      />
    </>
  );
}
