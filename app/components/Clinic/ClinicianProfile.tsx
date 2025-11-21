import { Chip, Card, CardBody } from '@nextui-org/react';
import { UserCheck, Mail, Calendar, User } from 'lucide-react';
import { intlFormat } from 'date-fns';
import useLocale from '~/hooks/useLocale';
import type { Clinician } from './types';

export type ClinicianProfileProps = {
  clinician: Clinician | null;
  isLoading?: boolean;
};

export default function ClinicianProfile({ clinician, isLoading }: ClinicianProfileProps) {
  const { locale } = useLocale();

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-4">
          <div className="animate-pulse h-8 bg-content2 rounded-lg w-1/3"></div>
          <Card>
            <CardBody className="space-y-4">
              <div className="animate-pulse h-4 bg-content2 rounded w-1/2"></div>
              <div className="animate-pulse h-4 bg-content2 rounded w-3/4"></div>
              <div className="animate-pulse h-4 bg-content2 rounded w-1/4"></div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (!clinician) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <UserCheck className="w-16 h-16 text-default-300 mb-4" />
        <h2 className="text-xl font-semibold text-default-600">Clinician not found</h2>
        <p className="text-default-500">This clinician may have been removed or the ID is invalid.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return intlFormat(
      new Date(dateString),
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      },
      { locale }
    );
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'primary';
      case 'clinician':
        return 'secondary';
      case 'support':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{clinician.fullName}</h1>
          <p className="text-default-600">Clinician Profile</p>
        </div>
      </div>

      {/* Main Profile Card */}
      <Card>
        <CardBody className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-default-600">Full Name</label>
                <p className="text-foreground">{clinician.fullName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-foreground">{clinician.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">Role</label>
                <div className="pt-1">
                  <Chip
                    color={getRoleColor(clinician.role)}
                    variant="flat"
                    className="capitalize"
                  >
                    {clinician.role}
                  </Chip>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">Clinician ID</label>
                <p className="text-foreground font-mono text-sm">{clinician.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">User ID</label>
                <p className="text-foreground font-mono text-sm">{clinician.userId}</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {clinician.permissions && Object.keys(clinician.permissions).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(clinician.permissions).map(([permission, granted]) => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-content1 rounded-lg">
                    <span className="text-sm capitalize">
                      {permission.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Chip
                      size="sm"
                      color={granted ? 'success' : 'danger'}
                      variant="flat"
                    >
                      {granted ? 'Granted' : 'Denied'}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-default-600">Added to Clinic</label>
                <p className="text-foreground">{formatDate(clinician.createdTime)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">Last Updated</label>
                <p className="text-foreground">{formatDate(clinician.updatedTime)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
