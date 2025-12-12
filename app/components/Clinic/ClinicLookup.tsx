import { Cross } from 'lucide-react';
import LookupForm from '~/components/ui/LookupForm';

type ClinicLookupProps = {
  error?: string;
  errorType?: 'validation' | 'api';
};

export default function ClinicLookup({
  error,
  errorType = 'validation',
}: ClinicLookupProps) {
  return (
    <LookupForm
      action="/clinics"
      icon={Cross}
      title="Clinic Lookup"
      placeholder="Clinic ID or Share Code"
      error={error}
      errorType={errorType}
    />
  );
}
