import Well from '~/partials/Well';
import type { User, Profile } from './types';
import { intlFormat } from 'date-fns';

import useLocale from '~/hooks/useLocale';

export type UserProfileProps = {
  user: User;
  profile: Profile;
};

export default function UserProfile({ user, profile }: UserProfileProps) {
  const { emailVerified, userid: userId, username, termsAccepted } = user;
  const { fullName, clinic } = profile;
  const locale = useLocale();
  console.log('locale', locale);

  return (
    <Well>
      <p className="text-xl">{fullName}</p>
      <ul className="text-sm">
        <li>
          <strong>User ID:</strong> {userId}
        </li>
        <li>
          <strong>Email:</strong> {username}
        </li>
        <li>
          <strong>Account Type:</strong> {clinic ? 'clinician' : 'patient'}
        </li>
        {clinic && (
          <li>
            <strong>Clinic Role:</strong> {clinic.role}
          </li>
        )}
        <li>
          <strong>Account Verified:</strong> {emailVerified.toString()}
        </li>
        <li>
          <strong>Member Since:</strong>{' '}
          {intlFormat(
            new Date(termsAccepted),
            {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            },
            { locale },
          )}
        </li>
      </ul>
    </Well>
  );
}
