import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import type { RecentClinician } from './types';

export type RecentCliniciansProps = {
  recentClinicians?: RecentClinician[]; // Keep for backward compatibility but use context
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email Address' },
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
    />
  );
}
