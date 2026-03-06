import { ExternalLink } from 'lucide-react';

const ROLLBAR_BASE_URL =
  'https://app.rollbar.com/a/tidepool/fix/items?prj=341746&isSnoozed=false&from=all&query=user_id:';

export type RollbarLinkProps = {
  userId: string;
};

export default function RollbarLink({ userId }: RollbarLinkProps) {
  return (
    <a
      href={`${ROLLBAR_BASE_URL}${userId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-2 py-1 -ml-2 rounded-md text-default-500 hover:text-foreground hover:bg-default/40 transition-all"
      aria-label="View Rollbar errors for this user"
    >
      <span className="text-default-400">Rollbar</span>
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </a>
  );
}
