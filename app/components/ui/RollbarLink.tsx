import { ExternalLink } from 'lucide-react';

const ROLLBAR_BASE_URL =
  'https://app.rollbar.com/a/tidepool/fix/items?prj=341746&prj=132318&isSnoozed=false&from=all&query=user_id%3A';

export type RollbarLinkProps = {
  userId: string;
};

export default function RollbarLink({ userId }: RollbarLinkProps) {
  return (
    <a
      href={`${ROLLBAR_BASE_URL}${userId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-2 py-1 -ml-2 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition-all"
      aria-label={`View Rollbar errors for user ${userId}`}
    >
      <span className="text-[color:var(--text-muted)]">Rollbar</span>
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </a>
  );
}
