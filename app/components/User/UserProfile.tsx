import type { User, Profile } from './types';

export type UserProfileProps = {
  user: User;
  profile: Profile;
};

export default function UserProfile({ user, profile }: UserProfileProps) {
  const { emailVerified, userid: userId, username } = user;
  const { fullName } = profile;
  return (
    <div className="flex flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4">
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
    </div>
  );
}
