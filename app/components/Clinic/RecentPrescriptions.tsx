import { useNavigate, useParams } from 'react-router';
import { useRecentItems } from './RecentItemsContext';
import RecentItemsTable from '~/components/ui/RecentItemsTable';
import StatusChip from '~/components/ui/StatusChip';
import CopyableIdentifier from '~/components/ui/CopyableIdentifier';
import type { RecentPrescription } from './types';

const columns = [
  { key: 'patientName', label: 'Patient Name' },
  { key: 'state', label: 'State' },
  { key: 'id', label: 'ID' },
];

export default function RecentPrescriptions() {
  const navigate = useNavigate();
  const params = useParams();
  const { recentPrescriptions } = useRecentItems();

  const handleSelect = (key: React.Key) => {
    navigate(`/clinics/${params.clinicId}/prescriptions/${key}`);
  };

  return (
    <RecentItemsTable<RecentPrescription>
      items={recentPrescriptions}
      columns={columns}
      onSelect={handleSelect}
      aria-label="Recently viewed prescriptions"
      title="Recently Viewed Prescriptions"
      emptyMessage="There are no recently viewed prescriptions to show"
      renderCell={(item, columnKey) => {
        if (columnKey === 'state') {
          return <StatusChip status={item.state} type="prescription" />;
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
        return item[columnKey as keyof RecentPrescription];
      }}
    />
  );
}
