import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { Mail } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { PatientInvite } from './types';
import ConfirmationModal from '../ConfirmationModal';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination, {
  getFirstItemOnPage,
  getLastItemOnPage,
} from '~/components/ui/TablePagination';
import DeleteActionButton from '~/components/ui/DeleteActionButton';
import { formatShortDate } from '~/utils/dateFormatters';

export type PatientInvitesTableProps = {
  invites: PatientInvite[];
  totalInvites: number;
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onRevokeInvite?: (inviteId: string) => void;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
};

type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

const columns: Column[] = [
  { key: 'patientName', label: 'PATIENT NAME', sortable: false },
  { key: 'birthday', label: 'BIRTHDAY', sortable: false },
  { key: 'userId', label: 'USER ID', sortable: false },
  { key: 'created', label: 'INVITED', sortable: false },
  { key: 'expiresAt', label: 'EXPIRES', sortable: false },
  { key: 'actions', label: 'ACTIONS', sortable: false },
];

export default function PatientInvitesTable({
  invites,
  totalInvites = 0,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  pageSize,
  onPageChange,
  onRevokeInvite,
  isFirstInGroup = false,
}: PatientInvitesTableProps) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<PatientInvite | null>(
    null,
  );

  // Filter to pending invites only
  const pendingInvites = React.useMemo(() => {
    return invites.filter((invite) => invite.status === 'pending');
  }, [invites]);

  // Calculate pagination details
  const effectivePageSize =
    pageSize ??
    (pendingInvites.length > 0 ? Math.ceil(totalInvites / totalPages) : 25);
  const firstInviteOnPage = getFirstItemOnPage(
    currentPage,
    effectivePageSize,
    pendingInvites.length,
  );
  const lastInviteOnPage = getLastItemOnPage(
    currentPage,
    effectivePageSize,
    pendingInvites.length,
  );

  const handleRevokeClick = (invite: PatientInvite) => {
    setSelectedInvite(invite);
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (selectedInvite && onRevokeInvite) {
      onRevokeInvite(selectedInvite.key);
    }
    setRevokeModalOpen(false);
    setSelectedInvite(null);
  };

  const renderCell = React.useCallback(
    (
      invite: PatientInvite,
      columnKey:
        | keyof PatientInvite
        | 'actions'
        | 'patientName'
        | 'birthday'
        | 'userId',
    ) => {
      const cellValue = invite[columnKey as keyof PatientInvite];

      switch (columnKey) {
        case 'patientName':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm">
                {invite.creator.profile.patient.fullName ||
                  invite.creator.profile.fullName}
              </p>
            </div>
          );
        case 'birthday':
          return (
            <p className="text-sm text-default-600">
              {invite.creator.profile.patient.birthday
                ? formatShortDate(
                    invite.creator.profile.patient.birthday,
                    locale,
                  )
                : '—'}
            </p>
          );
        case 'userId':
          return <p className="text-sm font-mono">{invite.creator.userid}</p>;
        case 'created':
          if (!cellValue) return <span className="text-default-400">—</span>;
          return (
            <p className="text-sm text-default-600">
              {formatShortDate(cellValue as string, locale)}
            </p>
          );
        case 'expiresAt':
          if (!cellValue) return <span className="text-default-400">—</span>;
          return (
            <p className="text-sm text-default-600">
              {formatShortDate(cellValue as string, locale)}
            </p>
          );
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
          return <span className="text-default-400">—</span>;
      }
    },
    [locale, onRevokeInvite],
  );

  const EmptyContent = (
    <TableEmptyState
      icon={Mail}
      message="No pending patient invites found for this clinic"
    />
  );

  const LoadingContent = (
    <TableLoadingState label="Loading patient invites..." />
  );

  return (
    <>
      <CollapsibleTableWrapper
        icon={<Mail className="h-5 w-5" />}
        title="Pending Patient Invites"
        totalItems={pendingInvites.length}
        isFirstInGroup={isFirstInGroup}
        showRange={{
          firstItem: firstInviteOnPage,
          lastItem: lastInviteOnPage,
        }}
      >
        <Table
          aria-label="Clinic patient invites table"
          className="flex flex-1 flex-col text-content1-foreground gap-4"
          shadow="none"
          removeWrapper
          selectionMode="single"
          onSelectionChange={(keys: 'all' | Set<React.Key>) => {
            const invite = pendingInvites.find(
              (inv) =>
                inv.key === (keys instanceof Set ? Array.from(keys)[0] : keys),
            );
            if (invite?.creator?.userid)
              navigate(`/users/${invite.creator.userid}`);
          }}
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
              <TableRow key={invite.key}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(
                      invite,
                      columnKey as
                        | keyof PatientInvite
                        | 'actions'
                        | 'patientName'
                        | 'birthday'
                        | 'userId',
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pendingInvites.length}
          pageSize={effectivePageSize}
          onPageChange={onPageChange}
        />
      </CollapsibleTableWrapper>

      <ConfirmationModal
        isOpen={revokeModalOpen}
        onClose={() => {
          setRevokeModalOpen(false);
          setSelectedInvite(null);
        }}
        onConfirm={handleConfirmRevoke}
        title="Revoke Patient Invitation"
        description={`Are you sure you want to revoke this patient invitation? ${selectedInvite?.creator?.profile?.patient?.fullName || selectedInvite?.creator?.profile?.fullName || 'This patient'} will no longer be able to join this clinic using this invite.`}
        confirmText="Revoke Invitation"
        confirmVariant="danger"
      />
    </>
  );
}
