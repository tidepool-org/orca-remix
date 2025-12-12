import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import type { RecentPatient } from './types';

const columns = [
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email Address' },
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
    />
  );
}
