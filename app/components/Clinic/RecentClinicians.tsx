import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import type { RecentClinician } from './types';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'id', label: 'ID' },
];

export default function RecentClinicians() {
  const navigate = useNavigate();
  const params = useParams();
  const { recentClinicians } = useRecentItems();

  const handleSelect = (key: React.Key) => {
    navigate(`/clinics/${params.clinicId}/clinicians/${key}`);
  };

  return (
    <RecentItemsTable<RecentClinician>
      items={recentClinicians}
      columns={columns}
      onSelect={handleSelect}
      aria-label="Recently viewed clinicians"
      title="Recently Viewed Clinicians"
      emptyMessage="There are no recently viewed clinicians to show"
      renderCell={(item, columnKey) => {
        if (columnKey === 'email') {
          return <CopyableIdentifier value={item.email} size="sm" />;
        }
        if (columnKey === 'id') {
          return (
            <CopyableIdentifier
              value={item.id}
              size="sm"
              truncate
              maxWidth="120px"
              monospace
            />
          );
        }
        return item[columnKey as keyof RecentClinician];
      }}
    />
  );
}
