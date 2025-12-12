import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { UserPlus } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import ConfirmationModal from '../ConfirmationModal';
import type { ClinicianInvite } from './types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import DeleteActionButton from '~/components/ui/DeleteActionButton';
import StatusChip from '~/components/ui/StatusChip';
import { formatShortDate } from '~/utils/dateFormatters';

export type ClinicianInvitesTableProps = {
  invites: ClinicianInvite[];
  totalInvites: number;
  isLoading?: boolean;
  onRevokeInvite?: (inviteId: string) => void;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
};

type Column = {
  key: string;
  label: string;
};

const columns: Column[] = [
  { key: 'email', label: 'EMAIL' },
  { key: 'roles', label: 'ROLE' },
  { key: 'createdTime', label: 'INVITED' },
  { key: 'status', label: 'STATUS' },
  { key: 'actions', label: 'ACTIONS' },
];

export default function ClinicianInvitesTable({
  invites,
  // totalInvites is available for future pagination support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalInvites: _totalInvites = 0,
  isLoading = false,
  onRevokeInvite,
  isFirstInGroup = false,
}: ClinicianInvitesTableProps) {
  const { locale } = useLocale();
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<ClinicianInvite | null>(
    null,
  );

  // Filter to pending invites only
  const pendingInvites = React.useMemo(() => {
    return invites.filter((invite) => invite.status === 'pending');
  }, [invites]);

  const handleRevokeClick = (invite: ClinicianInvite) => {
    setSelectedInvite(invite);
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (selectedInvite && onRevokeInvite) {
      onRevokeInvite(selectedInvite.inviteId);
    }
    setRevokeModalOpen(false);
    setSelectedInvite(null);
  };

  const renderCell = React.useCallback(
    (invite: ClinicianInvite, columnKey: string) => {
      switch (columnKey) {
        case 'email':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">{invite.email}</p>
              <p className="text-tiny text-default-400">
                ID: {invite.inviteId}
              </p>
            </div>
          );
        case 'roles': {
          const primaryRole =
            invite.roles && invite.roles.length > 0
              ? invite.roles[0]
              : 'Unknown';
          return <StatusChip status={primaryRole} type="role" />;
        }
        case 'createdTime':
          if (!invite.createdTime)
            return <span className="text-default-400">-</span>;
          return (
            <p className="text-sm text-default-600">
              {formatShortDate(invite.createdTime, locale)}
            </p>
          );
        case 'status':
          return <StatusChip status={invite.status} type="invite" />;
        case 'actions':
          return (
            <DeleteActionButton
              tooltip="Revoke invitation"
              ariaLabel="Revoke invitation"
              onPress={() => handleRevokeClick(invite)}
              isDisabled={!onRevokeInvite}
            />
          );
        default:
          return <span className="text-default-400">-</span>;
      }
    },
    [locale, onRevokeInvite],
  );

  const EmptyContent = (
    <TableEmptyState
      icon={UserPlus}
      message="Clinician invites data is not available"
      subMessage="The API does not support listing all clinician invites for a clinic"
    />
  );

  const LoadingContent = (
    <TableLoadingState label="Loading clinician invites..." />
  );

  return (
    <>
      <CollapsibleTableWrapper
        icon={<UserPlus className="h-5 w-5" />}
        title="Pending Clinician Invites"
        totalItems={pendingInvites.length}
        isFirstInGroup={isFirstInGroup}
      >
        <Table
          aria-label="Clinic clinician invites table"
          className="flex flex-1 flex-col text-content1-foreground gap-4"
          shadow="none"
          removeWrapper
          classNames={collapsibleTableClasses}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="text-content1-foreground font-medium"
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
            {pendingInvites.map((invite) => (
              <TableRow key={invite.inviteId}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(invite, columnKey as string)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleTableWrapper>

      <ConfirmationModal
        isOpen={revokeModalOpen}
        onClose={() => {
          setRevokeModalOpen(false);
          setSelectedInvite(null);
        }}
        onConfirm={handleConfirmRevoke}
        title="Revoke Clinician Invitation"
        description={`Are you sure you want to revoke this invitation? ${selectedInvite?.email || 'This person'} will no longer be able to join this clinic using this invite.`}
        confirmText="Revoke Invitation"
        confirmVariant="danger"
      />
    </>
  );
}
