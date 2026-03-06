import { useNavigate } from 'react-router';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import type { RecentUser } from './types';

export type RecentUsersProps = {
  rows: RecentUser[];
};

const columns = [
  { key: 'fullName', label: 'Name' },
  { key: 'username', label: 'Email Address' },
  { key: 'userid', label: 'ID' },
];

export default function RecentUsers({ rows }: RecentUsersProps) {
  const navigate = useNavigate();

  const handleSelect = (key: React.Key) => {
    navigate(`/users/${key}`);
  };

  return (
    <RecentItemsTable<RecentUser & { id?: string }>
      items={rows.map((r) => ({ ...r, id: r.userid }))}
      columns={columns}
      onSelect={handleSelect}
      aria-label="Recently viewed users"
      title="Recently Viewed Users"
      emptyMessage="There are no recently viewed users to show"
      renderCell={(item, columnKey) => {
        if (columnKey === 'username' && item.username) {
          return (
            <CopyableIdentifier
              value={item.username}
              size="sm"
              truncate
              maxWidth="100%"
            />
          );
        }
        if (columnKey === 'userid') {
          return (
            <CopyableIdentifier
              value={item.userid}
              size="sm"
              truncate
              maxWidth="120px"
              monospace
            />
          );
        }
        return item[columnKey as keyof RecentUser];
      }}
    />
  );
}
