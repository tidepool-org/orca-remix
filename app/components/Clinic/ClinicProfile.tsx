import type { Clinic } from './types';

export type UserProfileProps = {
  clinic: Clinic;
};

export default function ClinicProfile({ clinic }: UserProfileProps) {
  const { id, shareCode } = clinic;
  return (
    <ul>
      <li>User ID: {id}</li>
      <li>Share Code: {shareCode}</li>
    </ul>
  );
}
