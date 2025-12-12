import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { useNavigate } from 'react-router';
import { Users, Send, Inbox } from 'lucide-react';
import useLocale from '~/hooks/useLocale';
import CollapsibleTableWrapper from '../CollapsibleTableWrapper';
import { collapsibleTableClasses } from '~/utils/tableStyles';
import type { AccessPermissionsMap, ShareInvite, Permissions } from './types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import StatusChip from '~/components/ui/StatusChip';
import { formatShortDate } from '~/utils/dateFormatters';

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
    <TableEmptyState
      icon={Users}
      message="No accounts are sharing data with this user"
    />
  );

  const LoadingContent = <TableLoadingState />;

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
    <TableEmptyState
      icon={Users}
      message="This user is not sharing data with anyone"
    />
  );

  const LoadingContent = <TableLoadingState />;

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

  const formatType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const EmptyContent = (
    <TableEmptyState icon={Send} message="No pending sent invites" />
  );

  const LoadingContent = <TableLoadingState />;

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
                <StatusChip status={invite.status} type="invite" />
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {formatShortDate(invite.created, locale)}
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

  const formatType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const EmptyContent = (
    <TableEmptyState icon={Inbox} message="No pending received invites" />
  );

  const LoadingContent = <TableLoadingState />;

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
                <StatusChip status={invite.status} type="invite" />
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {formatShortDate(invite.created, locale)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CollapsibleTableWrapper>
  );
}
