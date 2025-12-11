import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Button,
  Tooltip,
} from '@heroui/react';
import { UserPlus, Trash2 } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import ConfirmationModal from '../ConfirmationModal';
import type { ClinicianInvite } from './types';

export type ClinicianInvitesTableProps = {
  invites: ClinicianInvite[];
  totalInvites: number;
  isLoading?: boolean;
  onRevokeInvite?: (inviteId: string) => void;
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
}: ClinicianInvitesTableProps) {
  const { locale } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
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
          return (
            <Chip
              className="capitalize"
              color={
                primaryRole.toLowerCase().includes('admin')
                  ? 'primary'
                  : 'default'
              }
              size="sm"
              variant="flat"
            >
              {primaryRole.replace('CLINIC_', '').toLowerCase()}
            </Chip>
          );
        }
        case 'createdTime':
          if (!invite.createdTime)
            return <span className="text-default-400">-</span>;
          return (
            <p className="text-sm text-default-600">
              {intlFormat(
                new Date(invite.createdTime),
                { year: 'numeric', month: 'short', day: 'numeric' },
                { locale },
              )}
            </p>
          );
        case 'status':
          return (
            <Chip
              className="capitalize"
              color={
                invite.status === 'pending'
                  ? 'warning'
                  : invite.status === 'accepted'
                    ? 'success'
                    : invite.status === 'declined'
                      ? 'danger'
                      : 'default'
              }
              size="sm"
              variant="flat"
            >
              {invite.status}
            </Chip>
          );
        case 'actions':
          return (
            <Tooltip content="Revoke invitation" color="danger">
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                onPress={() => handleRevokeClick(invite)}
                aria-label="Revoke invitation"
                isDisabled={!onRevokeInvite}
              >
                <Trash2 size={16} />
              </Button>
            </Tooltip>
          );
        default:
          return <span className="text-default-400">-</span>;
      }
    },
    [locale, onRevokeInvite],
  );

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <UserPlus className="w-12 h-12 text-default-300 mb-4" />
      <span className="text-default-500">
        Clinician invites data is not available
      </span>
      <span className="text-tiny text-default-400 mt-1">
        The API does not support listing all clinician invites for a clinic
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading clinician invites..." />
    </div>
  );

  return (
    <>
      <CollapsibleTableWrapper
        icon={<UserPlus className="h-5 w-5" />}
        title="Pending Clinician Invites"
        totalItems={pendingInvites.length}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        defaultExpanded={false}
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
            isLoading={isLoading}
            items={pendingInvites || []}
          >
            {(invite) => (
              <TableRow key={invite.inviteId}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(invite, columnKey as string)}
                  </TableCell>
                )}
              </TableRow>
            )}
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
