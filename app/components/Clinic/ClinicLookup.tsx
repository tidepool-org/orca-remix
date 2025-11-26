import { Form, useSearchParams } from 'react-router';
import { Input, Button } from '@nextui-org/react';
import { Cross } from 'lucide-react';
import React from 'react';
import Well from '~/partials/Well';

export default function ClinicLookup() {
  const [searchParams] = useSearchParams();

  const search = searchParams.get('search');
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    setSearchValue(search || '');
  }, [search]);

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
