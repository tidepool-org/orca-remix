import { useMemo, useState } from 'react';
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
import CollapsibleTableWrapper from '../ui/CollapsibleTableWrapper';
import { collapsibleTableClasses, columnClass } from '~/utils/tableStyles';
import type { AccessPermissionsMap, ShareInvite, Permissions } from './types';
import type { ResourceState } from '~/api.types';
import TableEmptyState from '~/components/ui/TableEmptyState';
import TableLoadingState from '~/components/ui/TableLoadingState';
import TablePagination from '~/components/ui/TablePagination';
import TableFilterInput from '~/components/ui/TableFilterInput';
import StatusChip from '~/components/ui/StatusChip';
import ResourceError from '~/components/ui/ResourceError';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import { formatShortDate } from '~/utils/dateFormatters';

const PAGE_SIZE = 25;

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
  trustingAccountsState,
  isLoading,
  currentUserId,
  userProfiles,
  isFirstInGroup,
}: {
  accounts: AccessPermissionsMap;
  trustingAccountsState?: ResourceState<AccessPermissionsMap>;
  isLoading?: boolean;
  currentUserId?: string;
  userProfiles?: Record<string, string>;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState('');

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    setCurrentPage(1);
  };

  // Filter (by name/id), sort by name, then paginate
  const entries = useMemo(() => {
    const sorted = Object.entries(accounts)
      .filter(([id]) => id !== currentUserId)
      .sort(([aId], [bId]) => {
        const aName = userProfiles?.[aId] ?? aId;
        const bName = userProfiles?.[bId] ?? bId;
        return aName.localeCompare(bName);
      });
    const searchTerm = filterValue.toLowerCase().trim();
    if (!searchTerm) return sorted;
    return sorted.filter(([id]) => {
      const name = (userProfiles?.[id] ?? '').toLowerCase();
      return name.includes(searchTerm) || id.toLowerCase().includes(searchTerm);
    });
  }, [accounts, currentUserId, userProfiles, filterValue]);
  const totalItems = entries.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pagedEntries = entries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns = [
    { key: 'name', label: 'Name' },
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

  // Check if there's an error state to display
  const hasError = trustingAccountsState?.status === 'error';

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Accounts Sharing With User"
      totalItems={totalItems}
      isFirstInGroup={isFirstInGroup}
    >
      {hasError ? (
        <ResourceError
          title="Accounts Sharing With User"
          message={trustingAccountsState.error.message}
        />
      ) : (
        <>
          <p className="text-sm text-default-500 mb-4">
            These accounts have granted this user access to view their data.
          </p>
          <TableFilterInput
            value={filterValue}
            onChange={handleFilterChange}
            placeholder="Filter by name or user ID..."
            aria-label="Filter accounts by name or user ID"
            className="mb-4"
          />
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
                <TableColumn key={column.key} className={columnClass}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              loadingState={isLoading ? 'loading' : 'idle'}
            >
              {pagedEntries.map(([userId, permissions]) => (
                <TableRow key={userId}>
                  <TableCell>
                    <span className="text-sm">
                      {userProfiles?.[userId] || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CopyableIdentifier value={userId} monospace size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {formatPermissions(permissions).map((perm) => (
                        <Chip
                          key={perm}
                          size="sm"
                          variant="flat"
                          color="primary"
                        >
                          {perm}
                        </Chip>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            showRange
          />
        </>
      )}
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Trusted Accounts (accounts user shares WITH)
export function TrustedAccountsTable({
  accounts,
  trustedAccountsState,
  isLoading,
  currentUserId,
  userProfiles,
  isFirstInGroup,
}: {
  accounts: AccessPermissionsMap;
  trustedAccountsState?: ResourceState<AccessPermissionsMap>;
  isLoading?: boolean;
  currentUserId?: string;
  userProfiles?: Record<string, string>;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState('');

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    setCurrentPage(1);
  };

  // Filter (by name/id), sort by name, then paginate
  const entries = useMemo(() => {
    const sorted = Object.entries(accounts)
      .filter(([id]) => id !== currentUserId)
      .sort(([aId], [bId]) => {
        const aName = userProfiles?.[aId] ?? aId;
        const bName = userProfiles?.[bId] ?? bId;
        return aName.localeCompare(bName);
      });
    const searchTerm = filterValue.toLowerCase().trim();
    if (!searchTerm) return sorted;
    return sorted.filter(([id]) => {
      const name = (userProfiles?.[id] ?? '').toLowerCase();
      return name.includes(searchTerm) || id.toLowerCase().includes(searchTerm);
    });
  }, [accounts, currentUserId, userProfiles, filterValue]);
  const totalItems = entries.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pagedEntries = entries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns = [
    { key: 'name', label: 'Name' },
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

  // Check if there's an error state to display
  const hasError = trustedAccountsState?.status === 'error';

  return (
    <CollapsibleTableWrapper
      icon={<Users className="h-5 w-5" />}
      title="Accounts User Shares With"
      totalItems={totalItems}
      isFirstInGroup={isFirstInGroup}
    >
      {hasError ? (
        <ResourceError
          title="Accounts User Shares With"
          message={trustedAccountsState.error.message}
        />
      ) : (
        <>
          <p className="text-sm text-default-500 mb-4">
            These accounts can view this user&apos;s data.
          </p>
          <TableFilterInput
            value={filterValue}
            onChange={handleFilterChange}
            placeholder="Filter by name or user ID..."
            aria-label="Filter accounts by name or user ID"
            className="mb-4"
          />
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
                <TableColumn key={column.key} className={columnClass}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              loadingState={isLoading ? 'loading' : 'idle'}
            >
              {pagedEntries.map(([userId, permissions]) => (
                <TableRow key={userId}>
                  <TableCell>
                    <span className="text-sm">
                      {userProfiles?.[userId] || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CopyableIdentifier value={userId} monospace size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {formatPermissions(permissions).map((perm) => (
                        <Chip
                          key={perm}
                          size="sm"
                          variant="flat"
                          color="secondary"
                        >
                          {perm}
                        </Chip>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            showRange
          />
        </>
      )}
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Sent Invites
export function SentInvitesTable({
  invites,
  sentInvitesState,
  isLoading,
  isFirstInGroup,
}: {
  invites: ShareInvite[];
  sentInvitesState?: ResourceState<ShareInvite[]>;
  isLoading?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
}) {
  const { locale } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = invites.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pagedInvites = invites.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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

  // Check if there's an error state to display
  const hasError = sentInvitesState?.status === 'error';

  return (
    <CollapsibleTableWrapper
      icon={<Send className="h-5 w-5" />}
      title="Sent Invites"
      totalItems={totalItems}
      isFirstInGroup={isFirstInGroup}
    >
      {hasError ? (
        <ResourceError
          title="Sent Invites"
          message={sentInvitesState.error.message}
        />
      ) : (
        <>
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
                <TableColumn key={column.key} className={columnClass}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              loadingState={isLoading ? 'loading' : 'idle'}
            >
              {pagedInvites.map((invite) => (
                <TableRow key={invite.key}>
                  <TableCell>
                    <CopyableIdentifier value={invite.email} size="sm" />
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
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            showRange
          />
        </>
      )}
    </CollapsibleTableWrapper>
  );
}

// Sub-component for Received Invites
export function ReceivedInvitesTable({
  invites,
  receivedInvitesState,
  isLoading,
  isFirstInGroup,
}: {
  invites: ShareInvite[];
  receivedInvitesState?: ResourceState<ShareInvite[]>;
  isLoading?: boolean;
  /** Mark this as the first table in a CollapsibleGroup to auto-expand it */
  isFirstInGroup?: boolean;
}) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = invites.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const pagedInvites = invites.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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

  // Check if there's an error state to display
  const hasError = receivedInvitesState?.status === 'error';

  return (
    <CollapsibleTableWrapper
      icon={<Inbox className="h-5 w-5" />}
      title="Received Invites"
      totalItems={totalItems}
      isFirstInGroup={isFirstInGroup}
    >
      {hasError ? (
        <ResourceError
          title="Received Invites"
          message={receivedInvitesState.error.message}
        />
      ) : (
        <>
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
              const invite = invites.find((i) => i.key === key);
              if (invite?.creatorId) navigate(`/users/${invite.creatorId}`);
            }}
            classNames={collapsibleTableClasses}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key} className={columnClass}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={EmptyContent}
              loadingContent={LoadingContent}
              loadingState={isLoading ? 'loading' : 'idle'}
            >
              {pagedInvites.map((invite) => (
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
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            showRange
          />
        </>
      )}
    </CollapsibleTableWrapper>
  );
}
