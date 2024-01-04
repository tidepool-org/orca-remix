import type { Clinic } from './types';

export type UserProfileProps = {
  clinic: Clinic;
};

export default function ClinicProfile({ clinic }: UserProfileProps) {
  const { id, shareCode } = clinic;
  return (
    <div className="flex flex-col p-6 lg:p-8 bg-content1 text-content1-foreground rounded-xl gap-4">
      <ul>
        <li>
          <strong>Clinic ID:</strong> {id}
        </li>
        <li>
          <strong>Share Code:</strong> {shareCode}
        </li>
      </ul>
    </div>
  );
}
