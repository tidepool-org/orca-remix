import { Form, useSearchParams } from 'react-router';
import { Input, Button } from "@heroui/react";
import { Cross } from 'lucide-react';
import React from 'react';
import Well from '~/partials/Well';
import { useToast } from '~/contexts/ToastContext';
import SectionHeader from '~/components/SectionHeader';
import { searchInputClasses } from '~/utils/tableStyles';

type ClinicLookupProps = {
  error?: string;
  errorType?: 'validation' | 'api';
};

export default function ClinicLookup({
  error,
  errorType = 'validation',
}: ClinicLookupProps) {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const search = searchParams.get('search');
  const [searchValue, setSearchValue] = React.useState(search);
  const lastErrorRef = React.useRef<string | undefined>();

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

  // Show toast only for API errors
  React.useEffect(() => {
    if (error && errorType === 'api' && error !== lastErrorRef.current) {
      showToast(error, 'error');
      lastErrorRef.current = error;
    }
  }, [error, errorType, showToast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <Form action="/clinics">
      <Well>
        <SectionHeader icon={Cross} title="Clinic Lookup" />

        <div className="flex items-center gap-4">
          <Input
            name="search"
            type="text"
            label="Clinic ID or Share Code"
            value={searchValue || ''}
            onChange={handleSearchChange}
            className="max-w-xs"
            classNames={searchInputClasses}
            isInvalid={!!error && errorType === 'validation'}
            errorMessage={errorType === 'validation' ? error : undefined}
          />
        </div>

        <div>
          <Button type="submit" color="primary">
            Search
          </Button>
        </div>
      </Well>
    </Form>
  );
}
