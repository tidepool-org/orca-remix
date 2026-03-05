import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import type { RecentPatient } from './types';

const columns = [
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'id', label: 'ID' },
];

export default function RecentPatients() {
  const navigate = useNavigate();
  const params = useParams();
  const { recentPatients } = useRecentItems();

  const handleSelect = (key: React.Key) => {
    navigate(`/clinics/${params.clinicId}/patients/${key}`);
  };

  return (
    <RecentItemsTable<RecentPatient>
      items={recentPatients}
      columns={columns}
      onSelect={handleSelect}
      aria-label="Recently viewed patients"
      title="Recently Viewed Patients"
      emptyMessage="There are no recently viewed patients to show"
      renderCell={(item, columnKey) => {
        if (columnKey === 'email' && item.email) {
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
        return item[columnKey as keyof RecentPatient];
      }}
    />
  );
}
