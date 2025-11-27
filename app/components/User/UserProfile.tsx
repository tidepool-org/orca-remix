import Well from '~/partials/Well';
import { intlFormat } from 'date-fns';
import ClinicsTable from '../Clinic/ClinicsTable';
import type { ClinicianClinicMembership } from '../Clinic/types';

import type { User, Profile } from './types';
import useLocale from '~/hooks/useLocale';
import ClipboardButton from '../ClipboardButton';

export type UserProfileProps = {
  user: User;
  profile: Profile;
  clinics?: ClinicianClinicMembership[];
  totalClinics?: number;
};

export default function UserProfile({
  user,
  profile,
  clinics = [],
  totalClinics = 0,
}: UserProfileProps) {
  const { emailVerified, userid: userId, username, termsAccepted } = user;
  const { fullName, clinic } = profile;
  const { locale } = useLocale();

  const isClinician = !!clinic;

  const userDetails = [
    {
      label: 'Email',
      value: username,
      copy: true,
    },
    {
      label: 'User ID',
      value: userId,
      copy: true,
    },
    {
      label: 'Account Type',
      value: clinic ? `clinician (${clinic.role})` : 'patient',
    },
    { label: 'Account Verified', value: emailVerified.toString() },
    {
      label: 'Member Since',
      value: intlFormat(
        new Date(termsAccepted),
        {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        },
        { locale },
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      <Well>
        <h1 className="text-xl">{fullName}</h1>

        <div className="text-small">
          {userDetails.map(({ label, value, copy }, i) => (
            <div
              key={i}
              className="flex justify-start flex-nowrap gap-2 items-center min-h-unit-8"
            >
              <strong>{label}:</strong>
              <p>{value}</p>
              {copy && <ClipboardButton clipboardText={value} />}
            </div>
          ))}
        </div>
      </Well>

      {isClinician && (
        <Well>
          <ClinicsTable
            clinics={clinics}
            totalClinics={totalClinics}
            totalPages={1}
            currentPage={1}
          />
        </Well>
      )}
    </div>
  );
}
