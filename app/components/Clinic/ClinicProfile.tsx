import Well from '~/partials/Well';
import type { Clinic } from './types';

export type UserProfileProps = {
  clinic: Clinic;
};

export default function ClinicProfile({ clinic }: UserProfileProps) {
  const { id, shareCode, name } = clinic;

  return (
    <Well>
      <ul>
        <li>
          <strong>Clinic Name:</strong> {name}
        </li>
        <li>
          <strong>Clinic ID:</strong> {id}
        </li>
        <li>
          <strong>Share Code:</strong> {shareCode}
        </li>
      </ul>
    </Well>
  );
}
