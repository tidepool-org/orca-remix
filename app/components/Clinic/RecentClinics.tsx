import { useNavigate } from 'react-router';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import type { RecentClinic } from './types';

export type RecentClinicsProps = {
  rows: RecentClinic[];
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'shareCode', label: 'Share Code' },
  { key: 'id', label: 'ID' },
];

export default function RecentClinics({ rows }: RecentClinicsProps) {
  const navigate = useNavigate();

  const handleSelect = (key: React.Key) => {
    navigate(`/clinics/${key}`);
  };

  return (
    <RecentItemsTable<RecentClinic>
      items={rows}
      columns={columns}
      onSelect={handleSelect}
      aria-label="Recently viewed clinics"
      title="Recently Viewed Clinics"
      emptyMessage="There are no recently viewed clinics to show"
      renderCell={(item, columnKey) => {
        if (columnKey === 'shareCode' && item.shareCode) {
          return <CopyableIdentifier value={item.shareCode} size="sm" />;
        }
        if (columnKey === 'id') {
          return (
            <CopyableIdentifier
              value={item.id}
              size="sm"
              truncate
              maxWidth="100%"
              monospace
            />
          );
        }
        return item[columnKey as keyof RecentClinic];
      }}
    />
  );
}
