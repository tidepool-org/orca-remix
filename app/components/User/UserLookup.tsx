import { UserCircle2Icon } from 'lucide-react';
import LookupForm from '~/components/ui/LookupForm';

type UserLookupProps = {
  error?: string;
  errorType?: 'validation' | 'api';
};

export default function UserLookup({
  error,
  errorType = 'validation',
}: UserLookupProps) {
  return (
    <LookupForm
      action="/users"
      icon={UserCircle2Icon}
      title="User Lookup"
      placeholder="User ID or Email Address"
      error={error}
      errorType={errorType}
    />
  );
}
