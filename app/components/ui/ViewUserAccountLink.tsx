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
      className="flex items-center gap-1 px-2 py-1 rounded-md text-default-500 hover:text-foreground hover:bg-default/40 transition-all"
      aria-label="View user account"
    >
      <span className="text-default-400">View User Account</span>
      <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </Link>
  );
}
