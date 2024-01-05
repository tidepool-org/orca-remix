import Well from '~/partials/Well';
import type { User, Profile } from './types';

export type UserProfileProps = {
  user: User;
  profile: Profile;
};

export default function UserProfile({ user, profile }: UserProfileProps) {
  const { emailVerified, userid: userId, username } = user;
  const { fullName } = profile;

  return (
    <Well>
      <ul>
        <li>
          <strong>Name:</strong> {fullName}
        </li>
        <li>
          <strong>User ID:</strong> {userId}
        </li>
        <li>
          <strong>Email Address:</strong> {username}
        </li>
        <li>
          <strong>Email Verified:</strong> {emailVerified.toString()}
        </li>
      </ul>
    </Well>
  );
}
