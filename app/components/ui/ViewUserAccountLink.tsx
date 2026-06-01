import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';

export type ViewUserAccountLinkProps = {
  /** The user ID to link to */
  userId: string;
};

export default function ViewUserAccountLink({
  userId,
}: ViewUserAccountLinkProps) {
  return (
    <Link
      to={`/users/${userId}`}
      className="flex items-center gap-1 px-2 py-1 -ml-2 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition-all"
      aria-label={`View user account ${userId}`}
    >
      <span className="text-[color:var(--text-muted)]">View User Account</span>
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </Link>
  );
}
