import { Link, useParams } from '@remix-run/react';
import { Card, CardBody, Avatar } from '@nextui-org/react';
import { UserCheck, Clock } from 'lucide-react';
import { useRecentItems } from './RecentItemsContext';
import type { RecentClinician } from './types';

export type RecentCliniciansProps = {
  recentClinicians?: RecentClinician[]; // Keep for backward compatibility but use context
};

export default function RecentClinicians({ recentClinicians: propClinicians }: RecentCliniciansProps) {
  const params = useParams();
  const { recentClinicians } = useRecentItems();

  // Always use context data for real-time updates
  const clinicians = recentClinicians;

  if (clinicians.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Clinicians</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="w-12 h-12 text-default-300 mb-4" />
            <span className="text-default-500">No recently viewed clinicians</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Clinicians</h3>
        </div>
        <div className="space-y-3">
          {clinicians.map((clinician) => (
            <Link
              key={clinician.id}
              to={`/clinics/${params.clinicId}/clinicians/${clinician.id}`}
              className="block p-3 rounded-lg bg-content1 hover:bg-content2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={clinician.fullName}
                  size="sm"
                  className="flex-shrink-0"
                  classNames={{
                    base: "bg-primary text-primary-foreground",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {clinician.fullName}
                  </h4>
                  <p className="text-sm text-default-600 truncate">
                    {clinician.email}
                  </p>
                  <p className="text-xs text-default-500 capitalize">
                    {clinician.role}
                  </p>
                </div>
                <div className="text-xs text-default-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(clinician.lastViewedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
