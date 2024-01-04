import type { User } from './types';

export type UserProfileProps = {
  user: User;
};

export default function UserProfile({ user }: UserProfileProps) {
  const { emailVerified, userid: userId, username } = user;
  return (
    <ul>
      <li>Username: {username}</li>
      <li>User ID: {userId}</li>
      <li>Email Verified: {emailVerified.toString()}</li>
    </ul>
  );
}
