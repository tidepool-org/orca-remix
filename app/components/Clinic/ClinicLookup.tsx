import { Form, useSearchParams } from 'react-router';
import { Input, Button } from '@nextui-org/react';
import { Cross } from 'lucide-react';
import React from 'react';
import Well from '~/partials/Well';
import { useToast } from '~/contexts/ToastContext';

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
        <div className="flex gap-2">
          <Cross />
          <h2 className="text-lg font-semibold">Clinic Lookup</h2>
        </div>

        <div className="flex items-center gap-4">
          <Input
            name="search"
            type="text"
            label="Clinic ID or Share Code"
            value={searchValue || ''}
            onChange={handleSearchChange}
            className="max-w-xs"
            classNames={{
              inputWrapper: 'lightTheme:bg-background',
              input: 'group-data-[has-value=true]:text-content1-foreground',
            }}
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
