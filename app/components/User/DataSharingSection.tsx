import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from '@heroui/react';
import { useNavigate } from 'react-router';
import { Users, Send, Inbox } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { AccessPermissionsMap, ShareInvite, Permissions } from './types';

export type DataSharingSectionProps = {
  // Accounts that share data WITH this user (user can view their data)
  trustingAccounts: AccessPermissionsMap;
  // Accounts that this user shares data WITH (they can view user's data)
  trustedAccounts: AccessPermissionsMap;
  // Pending invites sent by this user
  sentInvites: ShareInvite[];
  // Pending invites received by this user
  receivedInvites: ShareInvite[];
  isLoading?: boolean;
};

// Helper to convert permissions object to readable array
const formatPermissions = (permissions: Permissions): string[] => {
  const perms: string[] = [];
  if (permissions.root) perms.push('Owner');
  if (permissions.custodian) perms.push('Custodian');
  if (permissions.view) perms.push('View');
  if (permissions.note) perms.push('Notes');
  if (permissions.upload) perms.push('Upload');
  return perms;
};

// Sub-component for Trusting Accounts (accounts that share WITH user)
export function TrustingAccountsTable({
  accounts,
  isLoading,
  currentUserId,
}: {
  accounts: AccessPermissionsMap;
  isLoading?: boolean;
  currentUserId?: string;
}) {
  const navigate = useNavigate();
  // Filter out the current user's own ID from the list
  const entries = Object.entries(accounts).filter(
    ([userId]) => userId !== currentUserId,
  );
  const totalItems = entries.length;

  const columns = [
    { key: 'userId', label: 'User ID' },
    { key: 'permissions', label: 'Permissions' },
  ];

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Users className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">
        No accounts are sharing data with this user
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Accounts Sharing With User"
      totalItems={totalItems}
      defaultExpanded={false}
    >
      <p className="text-sm text-default-500 mb-4">
        These accounts have granted this user access to view their data.
      </p>
      <Table
        aria-label="Accounts sharing with user"
        shadow="none"
        removeWrapper
        selectionMode="single"
        onSelectionChange={(keys: 'all' | Set<React.Key>) => {
          const key = keys instanceof Set ? Array.from(keys)[0] : keys;
          if (key && key !== 'all') navigate(`/users/${key}`);
        }}
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
          {entries.map(([userId, permissions]) => (
            <TableRow key={userId}>
              <TableCell>
                <span className="font-mono text-sm">{userId}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {formatPermissions(permissions).map((perm) => (
                    <Chip key={perm} size="sm" variant="flat" color="primary">
                      {perm}
                    </Chip>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Trusted Accounts (accounts user shares WITH)
export function TrustedAccountsTable({
  accounts,
  isLoading,
  currentUserId,
}: {
  accounts: AccessPermissionsMap;
  isLoading?: boolean;
  currentUserId?: string;
}) {
  const navigate = useNavigate();
  // Filter out the current user's own ID from the list
  const entries = Object.entries(accounts).filter(
    ([userId]) => userId !== currentUserId,
  );
  const totalItems = entries.length;

  const columns = [
    { key: 'userId', label: 'User ID' },
    { key: 'permissions', label: 'Permissions' },
  ];

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Users className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">
        This user is not sharing data with anyone
      </span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Accounts User Shares With"
      totalItems={totalItems}
      defaultExpanded={false}
    >
      <p className="text-sm text-default-500 mb-4">
        These accounts can view this user&apos;s data.
      </p>
      <Table
        aria-label="Accounts user shares with"
        shadow="none"
        removeWrapper
        selectionMode="single"
        onSelectionChange={(keys: 'all' | Set<React.Key>) => {
          const key = keys instanceof Set ? Array.from(keys)[0] : keys;
          if (key && key !== 'all') navigate(`/users/${key}`);
        }}
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
          {entries.map(([userId, permissions]) => (
            <TableRow key={userId}>
              <TableCell>
                <span className="font-mono text-sm">{userId}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {formatPermissions(permissions).map((perm) => (
                    <Chip key={perm} size="sm" variant="flat" color="secondary">
                      {perm}
                    </Chip>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Sent Invites
export function SentInvitesTable({
  invites,
  isLoading,
}: {
  invites: ShareInvite[];
  isLoading?: boolean;
}) {
  const { locale } = useLocale();
  const totalItems = invites.length;

  const columns = [
    { key: 'email', label: 'Invitee Email' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Sent Date' },
  ];

  const getStatusColor = (
    status: string,
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'canceled':
      case 'declined':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Send className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">No pending sent invites</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Send className="h-5 w-5" />}
      title="Sent Invites"
      totalItems={totalItems}
      defaultExpanded={false}
    >
      <p className="text-sm text-default-500 mb-4">
        Pending invitations sent by this user to share their data.
      </p>
      <Table
        aria-label="Sent invites"
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
          {invites.map((invite) => (
            <TableRow key={invite.key}>
              <TableCell>
                <span className="text-sm">{invite.email}</span>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {formatType(invite.type)}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={getStatusColor(invite.status)}
                >
                  {invite.status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {intlFormat(
                    new Date(invite.created),
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                    { locale },
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Received Invites
export function ReceivedInvitesTable({
  invites,
  isLoading,
}: {
  invites: ShareInvite[];
  isLoading?: boolean;
}) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const totalItems = invites.length;

  const columns = [
    { key: 'creator', label: 'From' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Received Date' },
  ];

  const getStatusColor = (
    status: string,
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'canceled':
      case 'declined':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const EmptyContent = (
    <div className="flex flex-col items-center justify-center py-8">
      <Inbox className="w-12 h-12 text-default-300 mb-4" aria-hidden="true" />
      <span className="text-default-500">No pending received invites</span>
    </div>
  );

  const LoadingContent = (
    <div className="flex justify-center py-8">
      <Spinner size="lg" label="Loading..." />
    </div>
  );

  return (
    <CollapsibleTableWrapper
      icon={<Inbox className="h-5 w-5" />}
      title="Received Invites"
      totalItems={totalItems}
      defaultExpanded={false}
    >
      <p className="text-sm text-default-500 mb-4">
        Pending invitations received by this user from others to view their
        data.
      </p>
      <Table
        aria-label="Received invites"
        shadow="none"
        removeWrapper
        selectionMode="single"
        onSelectionChange={(keys: 'all' | Set<React.Key>) => {
          const key = keys instanceof Set ? Array.from(keys)[0] : keys;
          // Find the invite by key to get the creatorId
          const invite = invites.find((i) => i.key === key);
          if (invite?.creatorId) navigate(`/users/${invite.creatorId}`);
        }}
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
          {invites.map((invite) => (
            <TableRow key={invite.key}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {invite.creator?.profile?.fullName || 'Unknown'}
                  </span>
                  <span className="text-xs text-default-400 font-mono">
                    {invite.creatorId}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {formatType(invite.type)}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={getStatusColor(invite.status)}
                >
                  {invite.status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {intlFormat(
                    new Date(invite.created),
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                    { locale },
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}

// Main DataSharingSection component
export default function DataSharingSection({
  trustingAccounts,
  trustedAccounts,
  sentInvites,
  receivedInvites,
  isLoading = false,
}: DataSharingSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <TrustingAccountsTable
        accounts={trustingAccounts}
        isLoading={isLoading}
      />
      <TrustedAccountsTable accounts={trustedAccounts} isLoading={isLoading} />
      <SentInvitesTable invites={sentInvites} isLoading={isLoading} />
      <ReceivedInvitesTable invites={receivedInvites} isLoading={isLoading} />
    </div>
  );
}
