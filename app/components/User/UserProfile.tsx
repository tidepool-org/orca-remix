import type { User } from './types';

export type UserProfileProps = {
  user: User;
};

export default function UserProfile({ user }: UserProfileProps) {
  const { emailVerified, userid: userId, username } = user;
  return (
    <div className="flex flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4">
      <ul>
        <li>
          <strong>Username:</strong> {username}
        </li>
        <li>
          <strong>User ID:</strong> {userId}
        </li>
        <li>
          <strong>Email Verified:</strong> {emailVerified.toString()}
        </li>
      </ul>
    </div>
  );
}
