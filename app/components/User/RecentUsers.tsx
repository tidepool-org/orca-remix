import { useNavigate } from 'react-router';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import type { RecentUser } from './types';

export type RecentUsersProps = {
  rows: RecentUser[];
};

const columns = [
  { key: 'fullName', label: 'Name' },
  { key: 'username', label: 'Email Address' },
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
    />
  );
}
